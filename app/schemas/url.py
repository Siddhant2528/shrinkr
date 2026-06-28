from pydantic import BaseModel, HttpUrl, field_validator
from typing import Dict, Optional,List
from datetime import datetime
import re
from typing import Dict
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
            raise ValueError('Slug must be 3-30 characters: letters, numbers, hyphens, underscores only')
        return v

class URLResponse(BaseModel):
    short_code: str
    original_url: str
    short_url: str
    created_at: datetime

    class Config:
        from_attributes = True

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

class APIKeyCreate(BaseModel):
    name: str

class APIKeyResponse(BaseModel):
    id: int
    name: str
    key: str
    created_at: datetime

    class Config:
        from_attributes = True    

class TopLink(BaseModel):
    short_code: str
    original_url: str
    clicks: int
    created_at: datetime

    class Config:
        from_attributes = True

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

class UserCreate(BaseModel):
    email: str
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"    

class URLListResponse(BaseModel):
    id: int
    short_code: str
    original_url: str
    short_url: str
    clicks: int
    is_active: bool
    created_at: datetime
    expires_at: datetime | None

    class Config:
        from_attributes = True    

class PasswordChange(BaseModel):
    current_password: str
    new_password: str        