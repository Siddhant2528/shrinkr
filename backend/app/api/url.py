import math
from fastapi import APIRouter, Depends, HTTPException, Request, Response, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.config import get_settings
from app.schemas.url import (
    URLCreate, URLListResponse, URLResponse, PaginatedURLResponse,
    AnalyticsResponse, TimeSeriesResponse,
    APIKeyCreate, APIKeyResponse, APIKeyListResponse,
    DashboardResponse, DashboardSummary, TopLink, RecentClick,
)
from app.services import (
    url_service, click_service, analytics_service,
    cache_service, qr_service, api_key_service, dashboard_service,
)
from app.models.url import URL
from datetime import datetime, timezone
from app.core.auth import require_api_key, get_current_user, get_current_admin, get_optional_user
from app.models.api_key import APIKey as APIKeyModel
from app.models.user import User

router = APIRouter()
settings = get_settings()


def _build_url_list_response(url: URL) -> URLListResponse:
    return URLListResponse(
        id=url.id,
        short_code=url.short_code,
        original_url=url.original_url,
        short_url=f"{settings.BASE_URL}/{url.short_code}",
        clicks=url.clicks,
        is_active=url.is_active,
        is_archived=url.is_archived,
        is_favorite=url.is_favorite,
        created_at=url.created_at,
        expires_at=url.expires_at,
        tags=[{"id": t.id, "name": t.name, "color": t.color}
              for t in url.tags],
    )


# ─── Shorten ──────────────────────────────────────────────────────────────────

@router.post("/shorten", response_model=URLResponse)
def shorten_url(
    data: URLCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    if current_user and not current_user.is_verified:
        raise HTTPException(
            status_code=403, detail="Email verification required")
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


# ─── My Links (paginated) ─────────────────────────────────────────────────────

@router.get("/my-links", response_model=PaginatedURLResponse)
def get_my_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None),
    tag_id: int | None = Query(None),
    show_archived: bool = Query(False),
    favorites_only: bool = Query(False),
    sort_by: str = Query("newest"),
):
    query = (
        db.query(URL)
        .options(joinedload(URL.tags))
        .filter(URL.user_id == current_user.id)
    )

    # Archive filter
    if not show_archived:
        query = query.filter(URL.is_archived == False)  # noqa: E712

    # Favorites filter
    if favorites_only:
        query = query.filter(URL.is_favorite == True)  # noqa: E712

    # Tag filter (join)
    if tag_id is not None:
        query = query.filter(URL.tags.any(id=tag_id))

    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (URL.short_code.ilike(search_term)) | (
                URL.original_url.ilike(search_term))
        )

    # Sorting
    if sort_by == "oldest":
        query = query.order_by(URL.created_at.asc())
    elif sort_by == "clicks":
        query = query.order_by(URL.clicks.desc())
    else:  # newest (default)
        query = query.order_by(URL.created_at.desc())

    total_items = query.count()
    total_pages = max(1, math.ceil(total_items / limit))
    urls = query.offset((page - 1) * limit).limit(limit).all()

    return PaginatedURLResponse(
        items=[_build_url_list_response(u) for u in urls],
        total_items=total_items,
        page=page,
        total_pages=total_pages,
        limit=limit,
    )


# ─── Archive (replaces DELETE) ────────────────────────────────────────────────

@router.patch("/my-links/{short_code}/archive", response_model=URLListResponse)
def archive_my_link(
    short_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url_obj = db.query(URL).options(joinedload(URL.tags)).filter(
        URL.short_code == short_code,
        URL.user_id == current_user.id,
    ).first()

    if not url_obj:
        raise HTTPException(
            status_code=404, detail="Link not found or not yours")

    url_obj.is_archived = not url_obj.is_archived
    url_obj.is_active = not url_obj.is_archived
    db.commit()
    db.refresh(url_obj)

    # Evict from redirect cache
    cache_service.invalidate_url(short_code)

    return _build_url_list_response(url_obj)


# ─── Toggle Favorite ─────────────────────────────────────────────────────────

@router.patch("/my-links/{short_code}/favorite", response_model=URLListResponse)
def toggle_favorite(
    short_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url_obj = db.query(URL).options(joinedload(URL.tags)).filter(
        URL.short_code == short_code,
        URL.user_id == current_user.id,
    ).first()

    if not url_obj:
        raise HTTPException(
            status_code=404, detail="Link not found or not yours")

    url_obj.is_favorite = not url_obj.is_favorite
    db.commit()
    db.refresh(url_obj)

    return _build_url_list_response(url_obj)


# ─── Update link ─────────────────────────────────────────────────────────────

@router.patch("/my-links/{short_code}", response_model=URLListResponse)
def update_my_link(
    short_code: str,
    data: URLCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url_obj = db.query(URL).options(joinedload(URL.tags)).filter(
        URL.short_code == short_code,
        URL.user_id == current_user.id,
    ).first()

    if not url_obj:
        raise HTTPException(
            status_code=404, detail="Link not found or not yours")

    url_obj.original_url = str(data.original_url)
    db.commit()
    db.refresh(url_obj)

    cache_service.invalidate_url(short_code)

    return _build_url_list_response(url_obj)


# ─── Analytics ───────────────────────────────────────────────────────────────

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
        raise HTTPException(
            status_code=403, detail="Not authorized to view these analytics")

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
        raise HTTPException(
            status_code=403, detail="Not authorized to view these analytics")

    return analytics_service.get_click_timeseries(db, url_obj.id, days)


# ─── QR Code ─────────────────────────────────────────────────────────────────

@router.get("/qr/{short_code}")
def get_qr_code(short_code: str, db: Session = Depends(get_db)):
    url_obj = db.query(URL).filter(URL.short_code == short_code).first()

    if not url_obj or not url_obj.is_active:
        raise HTTPException(status_code=404, detail="Short URL not found")

    short_url = f"{settings.BASE_URL}/{short_code}"
    image_bytes = qr_service.get_qr_code(short_code, short_url)

    return Response(content=image_bytes, media_type="image/png")


# ─── API Keys ─────────────────────────────────────────────────────────────────

@router.get("/api-keys", response_model=list[APIKeyListResponse])
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return api_key_service.get_user_keys(db, current_user.id)


@router.post("/api-keys", response_model=APIKeyResponse)
def create_api_key(
    data: APIKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_verified:
        raise HTTPException(
            status_code=403, detail="Email verification required")
    api_key_obj, raw_key = api_key_service.create_api_key(
        db, data.name, current_user.id)
    return APIKeyResponse(
        id=api_key_obj.id,
        name=api_key_obj.name,
        key=raw_key,
        created_at=api_key_obj.created_at,
    )


@router.delete("/api-keys/{key_id}")
def revoke_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    api_key = api_key_service.revoke_key(db, key_id, current_user.id)
    if not api_key:
        raise HTTPException(
            status_code=404, detail="API key not found or not yours")
    return {"message": f"API key '{api_key.name}' revoked successfully"}


# ─── Shorten (API key protected) ─────────────────────────────────────────────

@router.post("/shorten/protected", response_model=URLResponse)
def shorten_url_protected(
    data: URLCreate,
    db: Session = Depends(get_db),
    api_key: APIKeyModel = Depends(require_api_key),
):
    try:
        url_obj = url_service.create_short_url(
            db,
            str(data.original_url),
            data.custom_slug,
            data.expires_in_days,
        )
    except url_service.SlugTakenError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return URLResponse(
        short_code=url_obj.short_code,
        original_url=url_obj.original_url,
        short_url=f"{settings.BASE_URL}/{url_obj.short_code}",
        created_at=url_obj.created_at,
    )


# ─── Admin Dashboard ──────────────────────────────────────────────────────────

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


# ─── Redirect (must be last — catch-all) ─────────────────────────────────────

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
        url_obj = db.query(URL).filter(URL.id == cached["url_id"]).first()
        if url_obj:
            url_obj.clicks += 1
            db.commit()
        return RedirectResponse(url=cached["original_url"])

    url_obj = db.query(URL).filter(URL.short_code == short_code).first()

    if not url_obj or not url_obj.is_active:
        raise HTTPException(status_code=404, detail="Short URL not found")

    if url_obj.expires_at:
        now = datetime.now(timezone.utc)
        if now > url_obj.expires_at:
            raise HTTPException(
                status_code=410, detail="This link has expired")

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
