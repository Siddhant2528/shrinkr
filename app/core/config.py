from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str
    APP_NAME: str = "Shrinkr"
    DEBUG: bool = True
    BASE_URL: str = "http://localhost:8000"
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()