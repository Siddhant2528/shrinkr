from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.redis import redis_client
from app.services import auth_service
from app.services.email_service import send_otp_email, generate_otp, send_password_reset_email
from app.schemas.url import UserCreate, UserResponse, TokenResponse, PasswordChange, VerifyOTPRequest, ResendOTPRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
def register(
    data: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    if auth_service.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if auth_service.get_user_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    user = auth_service.create_user(
        db, data.email, data.username, data.password)

    # Generate verification OTP and store in Redis
    otp = generate_otp()
    redis_client.setex(f"otp:{data.email}", 600, otp)

    # Send verification email in background
    background_tasks.add_task(send_otp_email, user.email, user.username, otp)

    return {"detail": "OTP sent to your email", "email": data.email}


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(
    data: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    stored_otp = redis_client.get(f"otp:{data.email}")
    if not stored_otp or stored_otp != data.otp:
        raise HTTPException(
            status_code=400, detail="Invalid or expired verification code")

    user = auth_service.get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    db.commit()

    redis_client.delete(f"otp:{data.email}")

    token = auth_service.create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/resend-otp")
def resend_otp(
    data: ResendOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = auth_service.get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    otp = generate_otp()
    redis_client.setex(f"otp:{data.email}", 600, otp)
    background_tasks.add_task(send_otp_email, user.email, user.username, otp)
    return {"detail": "Verification code sent"}


@router.post("/login", response_model=TokenResponse)
def login(
    background_tasks: BackgroundTasks,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = auth_service.authenticate_user(
        db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_verified:
        otp = generate_otp()
        redis_client.setex(f"otp:{user.email}", 600, otp)
        background_tasks.add_task(
            send_otp_email, user.email, user.username, otp)
        raise HTTPException(
            status_code=403,
            detail="Email verification required",
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
        raise HTTPException(
            status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = auth_service.hash_password(
        data.new_password)
    db.commit()
    return {"detail": "Password changed successfully"}


@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = auth_service.get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Email address not found")

    otp = generate_otp()
    redis_client.setex(f"password_reset_otp:{data.email}", 900, otp)
    background_tasks.add_task(
        send_password_reset_email, user.email, user.username, otp)
    return {"detail": "Password reset code sent"}


@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    stored_otp = redis_client.get(f"password_reset_otp:{data.email}")
    if not stored_otp or stored_otp != data.otp:
        raise HTTPException(
            status_code=400, detail="Invalid or expired verification code")

    user = auth_service.get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = auth_service.hash_password(data.new_password)
    db.commit()
    redis_client.delete(f"password_reset_otp:{data.email}")
    return {"detail": "Password reset successfully"}


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
    from sqlalchemy import func

    total_links = db.query(func.count(URL.id)).filter(
        URL.user_id == current_user.id).scalar()
    total_clicks = db.query(func.sum(URL.clicks)).filter(
        URL.user_id == current_user.id).scalar()
    active_links = db.query(func.count(URL.id)).filter(
        URL.user_id == current_user.id,
        URL.is_active
    ).scalar()

    return {
        "username": current_user.username,
        "email": current_user.email,
        "total_links": total_links or 0,
        "total_clicks": total_clicks or 0,
        "active_links": active_links or 0,
        "member_since": current_user.created_at,
    }
