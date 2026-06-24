from fastapi import APIRouter, Depends, HTTPException ,Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import get_settings
from app.schemas.url import URLCreate, URLResponse,AnalyticsResponse,TimeSeriesResponse
from app.services import url_service,click_service,analytics_service,cache_service,qr_service
from app.models.url import URL
from datetime import datetime, timezone

router = APIRouter()
settings = get_settings()

@router.post("/shorten", response_model=URLResponse)
def shorten_url(data: URLCreate, db: Session = Depends(get_db)):
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

@router.get("/analytics/{short_code}/timeseries", response_model=TimeSeriesResponse)
def get_timeseries(
    short_code: str,
    days: int = 30,
    db: Session = Depends(get_db)
):
    url_obj = db.query(URL).filter(URL.short_code == short_code).first()

    if not url_obj:
        raise HTTPException(status_code=404, detail="Short URL not found")

    return analytics_service.get_click_timeseries(db, url_obj.id, days)


@router.get("/analytics/{short_code}", response_model=AnalyticsResponse)
def get_link_analytics(short_code: str, db: Session = Depends(get_db)):
    url_obj = db.query(URL).filter(URL.short_code == short_code).first()

    if not url_obj:
        raise HTTPException(status_code=404, detail="Short URL not found")

    analytics = analytics_service.get_analytics(db, url_obj.id)

    return AnalyticsResponse(
        short_code=url_obj.short_code,
        total_clicks=analytics["total_clicks"],
        clicks_by_country=analytics["clicks_by_country"],
        clicks_by_device=analytics["clicks_by_device"],
        clicks_by_browser=analytics["clicks_by_browser"],
    )

@router.get("/qr/{short_code}")
def get_qr_code(short_code: str, db: Session = Depends(get_db)):
    url_obj = db.query(URL).filter(URL.short_code == short_code).first()

    if not url_obj or not url_obj.is_active:
        raise HTTPException(status_code=404, detail="Short URL not found")

    short_url = f"{settings.BASE_URL}/{short_code}"
    image_bytes = qr_service.get_qr_code(short_code, short_url)

    return Response(content=image_bytes, media_type="image/png")

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