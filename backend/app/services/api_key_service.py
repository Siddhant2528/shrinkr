import secrets
import hashlib
from sqlalchemy.orm import Session
from app.models.api_key import APIKey


def generate_api_key() -> str:
    return f"sk_{secrets.token_urlsafe(32)}"


def hash_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode()).hexdigest()


def create_api_key(db: Session, name: str, user_id: int) -> tuple[APIKey, str]:
    raw_key = generate_api_key()
    key_hash = hash_key(raw_key)

    api_key = APIKey(name=name, key_hash=key_hash, user_id=user_id)
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    return api_key, raw_key


def get_user_keys(db: Session, user_id: int) -> list[APIKey]:
    return (
        db.query(APIKey)
        .filter(APIKey.user_id == user_id)
        .order_by(APIKey.created_at.desc())
        .all()
    )


def revoke_key(db: Session, key_id: int, user_id: int) -> APIKey | None:
    api_key = (
        db.query(APIKey)
        .filter(APIKey.id == key_id, APIKey.user_id == user_id)
        .first()
    )
    if not api_key:
        return None
    api_key.is_active = False
    db.commit()
    db.refresh(api_key)
    return api_key


def validate_api_key(db: Session, raw_key: str) -> APIKey | None:
    key_hash = hash_key(raw_key)
    return (
        db.query(APIKey)
        .filter(APIKey.key_hash == key_hash, APIKey.is_active)
        .first()
    )
