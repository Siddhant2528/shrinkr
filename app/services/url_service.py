import secrets
import string
from sqlalchemy.orm import Session
from app.models.url import URL
from datetime import datetime, timezone, timedelta

class SlugTakenError(Exception):
    pass

def generate_code(length: int = 6) -> str:
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

def generate_unique_code(db: Session, length: int = 6) -> str:
    while True:
        code = generate_code(length)
        exists = db.query(URL).filter(URL.short_code == code).first()
        if not exists:
            return code

def create_short_url(
    db: Session,
    original_url: str,
    custom_slug: str | None = None,
    expires_in_days: int | None = None,
    user_id: int | None = None,
) -> URL:
    if custom_slug:
        exists = db.query(URL).filter(URL.short_code == custom_slug).first()
        if exists:
            raise SlugTakenError(f"Slug '{custom_slug}' is already taken")
        short_code = custom_slug
    else:
        short_code = generate_unique_code(db)

    expires_at = None
    if expires_in_days is not None:
        expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)

    url_obj = URL(
        original_url=original_url,
        short_code=short_code,
        expires_at=expires_at,
        user_id=user_id,
    )

    db.add(url_obj)
    db.commit()
    db.refresh(url_obj)
    return url_obj