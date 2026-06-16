from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional
from datetime import datetime
import re

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