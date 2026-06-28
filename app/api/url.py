from fastapi import APIRouter, Depends, HTTPException ,Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import get_settings
from app.schemas.url import URLCreate,URLListResponse, URLResponse,AnalyticsResponse,TimeSeriesResponse,APIKeyCreate, APIKeyResponse,DashboardResponse, DashboardSummary, TopLink, RecentClick
from app.services import url_service,click_service,analytics_service,cache_service,qr_service, api_key_service,dashboard_service
from app.models.url import URL
from datetime import datetime, timezone
from app.core.auth import require_api_key,get_current_user, get_current_admin, get_optional_user
from app.models.api_key import APIKey as APIKeyModel
from app.models.user import User

router = APIRouter()
settings = get_settings()

@router.post("/shorten", response_model=URLResponse)
def shorten_url(
    data: URLCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    try:
        url_obj = url_service.create_short_url(
            db,
            str(data.original_url),
            data.custom_slug,
            data.expires_in_days,
            user_id=current_user.id if current_user else None,
        )
    except url_service.SlugTakenError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return URLResponse(
        short_code=url_obj.short_code,
        original_url=url_obj.original_url,
        short_url=f"{settings.BASE_URL}/{url_obj.short_code}",
        created_at=url_obj.created_at,
    )

@router.get("/my-links", response_model=list[URLListResponse])
def get_my_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    urls = (
        db.query(URL)
        .filter(URL.user_id == current_user.id)
        .order_by(URL.created_at.desc())
        .all()
    )
    return [
        URLListResponse(
            id=url.id,
            short_code=url.short_code,
            original_url=url.original_url,
            short_url=f"{settings.BASE_URL}/{url.short_code}",
            clicks=url.clicks,
            is_active=url.is_active,
            created_at=url.created_at,
            expires_at=url.expires_at,
        )
        for url in urls
    ]

@router.delete("/my-links/{short_code}")
def delete_my_link(
    short_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url_obj = db.query(URL).filter(
        URL.short_code == short_code,
        URL.user_id == current_user.id,
    ).first()

    if not url_obj:
        raise HTTPException(status_code=404, detail="Link not found or not yours")

    url_obj.is_active = False
    db.commit()
    return {"message": f"Link '{short_code}' deactivated successfully"}

@router.patch("/my-links/{short_code}", response_model=URLListResponse)
def update_my_link(
    short_code: str,
    data: URLCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url_obj = db.query(URL).filter(
        URL.short_code == short_code,
        URL.user_id == current_user.id,
    ).first()

    if not url_obj:
        raise HTTPException(status_code=404, detail="Link not found or not yours")

    url_obj.original_url = str(data.original_url)
    db.commit()
    db.refresh(url_obj)

    from app.services.cache_service import invalidate_url
    invalidate_url(short_code)

    return URLListResponse(
        id=url_obj.id,
        short_code=url_obj.short_code,
        original_url=url_obj.original_url,
        short_url=f"{settings.BASE_URL}/{url_obj.short_code}",
        clicks=url_obj.clicks,
        is_active=url_obj.is_active,
        created_at=url_obj.created_at,
        expires_at=url_obj.expires_at,
    )

@router.get("/analytics/{short_code}", response_model=AnalyticsResponse)
def get_link_analytics(
    short_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url_obj = db.query(URL).filter(URL.short_code == short_code).first()

    if not url_obj:
        raise HTTPException(status_code=404, detail="Short URL not found")

    if url_obj.user_id and url_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these analytics")

    analytics = analytics_service.get_analytics(db, url_obj.id)

    return AnalyticsResponse(
        short_code=url_obj.short_code,
        total_clicks=analytics["total_clicks"],
        clicks_by_country=analytics["clicks_by_country"],
        clicks_by_device=analytics["clicks_by_device"],
        clicks_by_browser=analytics["clicks_by_browser"],
    )

@router.get("/analytics/{short_code}/timeseries", response_model=TimeSeriesResponse)
def get_timeseries(
    short_code: str,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url_obj = db.query(URL).filter(URL.short_code == short_code).first()

    if not url_obj:
        raise HTTPException(status_code=404, detail="Short URL not found")

    if url_obj.user_id and url_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these analytics")

    return analytics_service.get_click_timeseries(db, url_obj.id, days)
@router.get("/qr/{short_code}")
def get_qr_code(short_code: str, db: Session = Depends(get_db)):
    url_obj = db.query(URL).filter(URL.short_code == short_code).first()

    if not url_obj or not url_obj.is_active:
        raise HTTPException(status_code=404, detail="Short URL not found")

    short_url = f"{settings.BASE_URL}/{short_code}"
    image_bytes = qr_service.get_qr_code(short_code, short_url)

    return Response(content=image_bytes, media_type="image/png")

@router.post("/api-keys", response_model=APIKeyResponse)
def create_api_key(data: APIKeyCreate, db: Session = Depends(get_db)):
    api_key_obj, raw_key = api_key_service.create_api_key(db, data.name)
    return APIKeyResponse(
        id=api_key_obj.id,
        name=api_key_obj.name,
        key=raw_key,
        created_at=api_key_obj.created_at,
    )

@router.post("/shorten/protected", response_model=URLResponse)
def shorten_url_protected(
    data: URLCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        url_obj = url_service.create_short_url(
            db,
            str(data.original_url),
            data.custom_slug,
            data.expires_in_days,
            user_id=current_user.id,
        )
    except url_service.SlugTakenError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return URLResponse(
        short_code=url_obj.short_code,
        original_url=url_obj.original_url,
        short_url=f"{settings.BASE_URL}/{url_obj.short_code}",
        created_at=url_obj.created_at,
    )

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    summary = dashboard_service.get_summary(db)
    top_links = dashboard_service.get_top_links(db)
    countries = dashboard_service.get_country_breakdown(db)
    devices = dashboard_service.get_device_breakdown(db)
    recent = dashboard_service.get_recent_clicks(db)

    return DashboardResponse(
        summary=DashboardSummary(**summary),
        top_links=[TopLink(**link) for link in top_links],
        clicks_by_country=countries,
        clicks_by_device=devices,
        recent_clicks=[RecentClick(**click) for click in recent],
    )

@router.get("/dashboard/summary", response_model=DashboardSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return DashboardSummary(**dashboard_service.get_summary(db))

@router.get("/dashboard/countries")
def get_countries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return dashboard_service.get_country_breakdown(db)

@router.get("/dashboard/devices")
def get_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return dashboard_service.get_device_breakdown(db)

@router.get("/dashboard/top-links")
def get_top_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return dashboard_service.get_top_links(db)

@router.get("/dashboard/recent")
def get_recent(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    return dashboard_service.get_recent_clicks(db)

@router.get("/{short_code}")
def redirect_to_url(short_code: str, request: Request, db: Session = Depends(get_db)):
    cached = cache_service.get_cached_url(short_code)

    if cached:
        click_service.record_click(
            db,
            url_id=cached["url_id"],
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent"),
            referer=request.headers.get("referer"),
        )
        return RedirectResponse(url=cached["original_url"])

    url_obj = db.query(URL).filter(URL.short_code == short_code).first()

    if not url_obj or not url_obj.is_active:
        raise HTTPException(status_code=404, detail="Short URL not found")

    if url_obj.expires_at:
        now = datetime.now(timezone.utc)
        if now > url_obj.expires_at:
            raise HTTPException(status_code=410, detail="This link has expired")

    cache_service.cache_url(short_code, url_obj.original_url, url_obj.id)

    click_service.record_click(
        db,
        url_id=url_obj.id,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent"),
        referer=request.headers.get("referer"),
    )

    url_obj.clicks += 1
    db.commit()

    return RedirectResponse(url=url_obj.original_url)