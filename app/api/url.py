from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import get_settings
from app.schemas.url import URLCreate, URLResponse
from app.services import url_service
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

@router.get("/{short_code}")
def redirect_to_url(short_code: str, db: Session = Depends(get_db)):
    url_obj = db.query(URL).filter(URL.short_code == short_code).first()

    if not url_obj or not url_obj.is_active:
        raise HTTPException(status_code=404, detail="Short URL not found")

    if url_obj.expires_at:
        now = datetime.now(timezone.utc)
        if now > url_obj.expires_at:
            raise HTTPException(status_code=410, detail="This link has expired")

    return RedirectResponse(url=url_obj.original_url)