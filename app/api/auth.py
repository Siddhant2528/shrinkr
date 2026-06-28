from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services import auth_service
from app.schemas.url import UserCreate, UserResponse, TokenResponse,PasswordChange
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if auth_service.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if auth_service.get_user_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    user = auth_service.create_user(db, data.email, data.username, data.password)
    return user

@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth_service.create_access_token(user.id)
    return TokenResponse(access_token=token)

@router.post("/change-password")
def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not auth_service.verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = auth_service.hash_password(data.new_password)
    db.commit()

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(current_user: User = Depends(get_current_user)):
    token = auth_service.create_access_token(current_user.id)
    return TokenResponse(access_token=token)  
  
@router.get("/my-stats")
def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.url import URL
    from app.models.click import Click
    from sqlalchemy import func

    total_links = db.query(func.count(URL.id)).filter(URL.user_id == current_user.id).scalar()
    total_clicks = db.query(func.sum(URL.clicks)).filter(URL.user_id == current_user.id).scalar()
    active_links = db.query(func.count(URL.id)).filter(
        URL.user_id == current_user.id,
        URL.is_active == True
    ).scalar()

    return {
        "username": current_user.username,
        "email": current_user.email,
        "total_links": total_links or 0,
        "total_clicks": total_clicks or 0,
        "active_links": active_links or 0,
        "member_since": current_user.created_at,
    }