from pydantic import BaseModel, HttpUrl, field_validator, ConfigDict
from typing import Dict, Optional, List
from datetime import datetime
import re


# ─── Tag schemas ──────────────────────────────────────────────────────────────

class TagResponse(BaseModel):
    id: int
    name: str
    color: str

    model_config = ConfigDict(from_attributes=True)


# ─── URL schemas ──────────────────────────────────────────────────────────────

class URLCreate(BaseModel):
    original_url: HttpUrl
    custom_slug: Optional[str] = None
    expires_in_days: Optional[int] = None

    @field_validator('custom_slug')
    @classmethod
    def validate_slug(cls, v):
        if v is None:
            return v
        if not re.match(r'^[a-zA-Z0-9_-]{3,30}$', v):
            raise ValueError(
                'Slug must be 3-30 characters: letters, numbers, hyphens, underscores only')
        return v


class URLResponse(BaseModel):
    short_code: str
    original_url: str
    short_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class URLListResponse(BaseModel):
    id: int
    short_code: str
    original_url: str
    short_url: str
    clicks: int
    is_active: bool
    is_archived: bool
    is_favorite: bool
    created_at: datetime
    expires_at: datetime | None
    tags: List[TagResponse] = []

    model_config = ConfigDict(from_attributes=True)


class PaginatedURLResponse(BaseModel):
    items: List[URLListResponse]
    total_items: int
    page: int
    total_pages: int
    limit: int


# ─── Analytics schemas ────────────────────────────────────────────────────────

class ClicksPerDay(BaseModel):
    date: str
    clicks: int


class TimeSeriesResponse(BaseModel):
    timeseries: List[ClicksPerDay]


class AnalyticsResponse(BaseModel):
    short_code: str
    total_clicks: int
    clicks_by_country: Dict[str, int]
    clicks_by_device: Dict[str, int]
    clicks_by_browser: Dict[str, int]


# ─── API Key schemas ───────────────────────────────────────────────────────────

class APIKeyCreate(BaseModel):
    name: str


class APIKeyResponse(BaseModel):
    id: int
    name: str
    key: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class APIKeyListResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─── Dashboard schemas ────────────────────────────────────────────────────────

class TopLink(BaseModel):
    short_code: str
    original_url: str
    clicks: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecentClick(BaseModel):
    short_code: str
    country: str | None
    device: str | None
    browser: str | None
    clicked_at: datetime


class DashboardSummary(BaseModel):
    total_urls: int
    total_clicks: int
    clicks_today: int
    active_urls: int


class DashboardResponse(BaseModel):
    summary: DashboardSummary
    top_links: list[TopLink]
    clicks_by_country: Dict[str, int]
    clicks_by_device: Dict[str, int]
    recent_clicks: list[RecentClick]


# ─── Auth schemas ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_admin: bool
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str


class ResendOTPRequest(BaseModel):
    email: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str
