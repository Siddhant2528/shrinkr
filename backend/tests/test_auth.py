"""Tests for authentication endpoints: register, login, verify-otp, me, change-password."""
import pytest
from unittest.mock import patch, MagicMock


# ── Registration ───────────────────────────────────────────────────────────────

def test_register_success(client):
    """New user registration returns 200 with email confirmation."""
    resp = client.post("/auth/register", json={
        "email": "newuser@example.com",
        "username": "newuser",
        "password": "Pass1!",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert data["email"] == "newuser@example.com"


def test_register_duplicate_email(client, registered_user):
    """Registering with an existing email returns 400."""
    resp = client.post("/auth/register", json={
        "email": registered_user["email"],
        "username": "different_user",
        "password": "Pass1!",
    })
    assert resp.status_code == 400
    assert "Email already registered" in resp.json()["detail"]


def test_register_duplicate_username(client, registered_user):
    """Registering with an existing username returns 400."""
    resp = client.post("/auth/register", json={
        "email": "another@example.com",
        "username": registered_user["username"],
        "password": "Pass1!",
    })
    assert resp.status_code == 400
    assert "Username already taken" in resp.json()["detail"]



# ── Login ──────────────────────────────────────────────────────────────────────

def test_login_unverified_user_returns_403(client, registered_user):
    """Unverified users cannot log in — they get a 403 with a reminder."""
    resp = client.post(
        "/auth/login",
        data={"username": registered_user["email"], "password": registered_user["password"]},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 403
    assert "verification" in resp.json()["detail"].lower()


def test_login_wrong_password_returns_401(client, registered_user):
    """Wrong credentials return 401."""
    resp = client.post(
        "/auth/login",
        data={"username": registered_user["email"], "password": "wrongpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 401


def test_login_verified_user_returns_token(client, verified_user):
    """A verified user receives a JWT access token on login."""
    creds = verified_user["credentials"]
    resp = client.post(
        "/auth/login",
        data={"username": creds["email"], "password": creds["password"]},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 20


def test_login_unknown_email_returns_401(client):
    """Login with unknown email returns 401."""
    resp = client.post(
        "/auth/login",
        data={"username": "nobody@example.com", "password": "anything"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 401


# ── /auth/me ───────────────────────────────────────────────────────────────────

def test_me_returns_current_user(client, verified_user, auth_headers):
    """GET /auth/me returns the authenticated user's profile."""
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == verified_user["credentials"]["email"]
    assert data["username"] == verified_user["credentials"]["username"]
    assert "hashed_password" not in data


def test_me_without_token_returns_401(client):
    """GET /auth/me without a token returns 401."""
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_me_with_invalid_token_returns_401(client):
    """GET /auth/me with a garbage token returns 401."""
    resp = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401


# ── /auth/my-stats ────────────────────────────────────────────────────────────

def test_my_stats_returns_correct_shape(client, auth_headers):
    """GET /auth/my-stats returns expected stat fields."""
    resp = client.get("/auth/my-stats", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    for field in ["username", "email", "total_links", "total_clicks", "active_links"]:
        assert field in data, f"Missing field: {field}"


# ── /auth/change-password ─────────────────────────────────────────────────────

def test_change_password_success(client, verified_user, auth_headers, db):
    """Authenticated user can change their password."""
    creds = verified_user["credentials"]
    resp = client.post("/auth/change-password", json={
        "current_password": creds["password"],
        "new_password": "NewSecurePass456!",
    }, headers=auth_headers)
    assert resp.status_code == 200
    assert "success" in resp.json()["detail"].lower()


def test_change_password_wrong_current(client, auth_headers):
    """Wrong current password returns 400."""
    resp = client.post("/auth/change-password", json={
        "current_password": "totally-wrong",
        "new_password": "NewPass123!",
    }, headers=auth_headers)
    assert resp.status_code == 400


# ── /auth/refresh ─────────────────────────────────────────────────────────────

def test_token_refresh_returns_new_token(client, auth_headers):
    """POST /auth/refresh returns a new access token."""
    resp = client.post("/auth/refresh", headers=auth_headers)
    assert resp.status_code == 200
    assert "access_token" in resp.json()


# ── OTP / verify-otp ─────────────────────────────────────────────────────────

def test_verify_otp_invalid_code_returns_400(client, registered_user):
    """Submitting a wrong OTP returns 400."""
    from app.core.redis import redis_client
    redis_client.get.return_value = "123456"  # Stored OTP

    resp = client.post("/auth/verify-otp", json={
        "email": registered_user["email"],
        "otp": "000000",  # Wrong OTP
    })
    assert resp.status_code == 400


def test_resend_otp_already_verified_returns_400(client, verified_user):
    """Resending OTP to an already-verified user returns 400."""
    resp = client.post("/auth/resend-otp", json={
        "email": verified_user["credentials"]["email"],
    })
    assert resp.status_code == 400
    assert "already verified" in resp.json()["detail"].lower()
