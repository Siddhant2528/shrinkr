from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.api_key_service import validate_api_key
from app.models.api_key import APIKey

def require_api_key(
    x_api_key: str = Header(...),
    db: Session = Depends(get_db)
) -> APIKey:
    api_key = validate_api_key(db, x_api_key)
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    return api_key