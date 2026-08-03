from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from functools import lru_cache

_INSECURE_SECRET_KEYS = {
    "your-super-secret-key-change-in-production",
    "secret",
    "changeme",
    "change-me",
}


class Settings(BaseSettings):
    DATABASE_URL: str
    APP_NAME: str = "Shrinkr"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    BASE_URL: str = "http://localhost:8000"
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_SSL: bool = False
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24

    # Email Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "onboarding@brevo.com"
    BREVO_API_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_secure(cls, v: str) -> str:
        if v in _INSECURE_SECRET_KEYS or len(v) < 32:
            raise ValueError(
                "SECRET_KEY is insecure. Generate one with: openssl rand -hex 32"
            )
        return v

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")



@lru_cache()
def get_settings() -> Settings:
    return Settings()
