"""
Test fixtures for Shrinkr backend.

Uses SQLite in-memory so tests run with zero external dependencies
(no Postgres, no Redis required in CI).
"""
import os
import pytest
from unittest.mock import MagicMock

# ── Set env vars BEFORE importing any app code ────────────────────────────────
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-32ch"
os.environ["REDIS_HOST"] = "localhost"
os.environ["DEBUG"] = "True"
os.environ["DEFAULT_ADMIN_PASSWORD"] = "test-admin"

# ── Build Redis mock and inject BEFORE app modules load ───────────────────────
_pipeline_mock = MagicMock()
_pipeline_mock.zremrangebyscore = MagicMock(return_value=None)
_pipeline_mock.zcard = MagicMock(return_value=None)
_pipeline_mock.zadd = MagicMock(return_value=None)
_pipeline_mock.expire = MagicMock(return_value=None)
_pipeline_mock.execute = MagicMock(return_value=[0, 0, 1, True])

_redis_mock = MagicMock()
_redis_mock.get = MagicMock(return_value=None)
_redis_mock.set = MagicMock(return_value=True)
_redis_mock.setex = MagicMock(return_value=True)
_redis_mock.delete = MagicMock(return_value=1)
_redis_mock.hgetall = MagicMock(return_value={})
_redis_mock.hset = MagicMock(return_value=True)
_redis_mock.expire = MagicMock(return_value=True)
_redis_mock.pipeline = MagicMock(return_value=_pipeline_mock)

import sys
_fake_redis_module = MagicMock()
_fake_redis_module.Redis = MagicMock(return_value=_redis_mock)
sys.modules["redis"] = _fake_redis_module

# ── Import app after mocks are in place ───────────────────────────────────────
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.core.database import Base, get_db
from app.main import app

# Patch redis_client reference in all modules that use it
import app.core.redis as _redis_mod
_redis_mod.redis_client = _redis_mock
import app.services.rate_limiter as _rl_mod
_rl_mod.redis_client = _redis_mock
import app.services.cache_service as _cache_mod
_cache_mod.redis_client = _redis_mock
import app.api.auth as _auth_api_mod
_auth_api_mod.redis_client = _redis_mock

# Patch bcrypt calls so tests work regardless of bcrypt/passlib version mismatch
import app.services.auth_service as _auth_svc
_FAKE_HASH_PREFIX = "$test$"
_orig_hash_password = _auth_svc.hash_password
_orig_verify_password = _auth_svc.verify_password
_orig_authenticate_user = _auth_svc.authenticate_user

def _test_hash(pw):
    return f"{_FAKE_HASH_PREFIX}{pw}"

def _test_verify(plain, hashed):
    return hashed == f"{_FAKE_HASH_PREFIX}{plain}"

def _test_authenticate(db, email, password):
    user = _auth_svc.get_user_by_email(db, email)
    if not user:
        return None
    if not _test_verify(password, user.hashed_password):
        return None
    return user

_auth_svc.hash_password = _test_hash
_auth_svc.verify_password = _test_verify
_auth_svc.authenticate_user = _test_authenticate

# ── SQLite in-memory engine ───────────────────────────────────────────────────
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    """One session per test, shared across all fixtures in that test."""
    session = TestingSessionLocal()
    yield session
    session.close()


# Alias for backward compat with tests that use `db`
@pytest.fixture()
def db(db_session):
    return db_session


@pytest.fixture()
def client(db_session):
    """TestClient wired to the per-test DB session."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    # raise_server_exceptions=False so we can assert on 5xx responses
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def registered_user(client, db_session):
    """Register a user via the API and return credentials.
    Uses a uuid-based email to avoid duplicates across tests in the shared DB.
    """
    import uuid
    uid = uuid.uuid4().hex[:8]
    payload = {
        "email": f"user-{uid}@example.com",
        "username": f"user{uid}",
        "password": "Pass1!",   # short to avoid bcrypt 72-byte limit
    }
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code == 200, f"Registration failed: {resp.text}"
    return payload



@pytest.fixture()
def verified_user(client, db_session, registered_user):
    """Register + verify user in DB, then login and return token."""
    from app.models.user import User

    user = db_session.query(User).filter(
        User.email == registered_user["email"]
    ).first()
    assert user is not None, "registered_user fixture must create the user first"

    user.is_verified = True
    db_session.commit()

    resp = client.post(
        "/auth/login",
        data={
            "username": registered_user["email"],
            "password": registered_user["password"],
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token = resp.json()["access_token"]
    return {"user": user, "token": token, "credentials": registered_user}


@pytest.fixture()
def auth_headers(verified_user):
    return {"Authorization": f"Bearer {verified_user['token']}"}
