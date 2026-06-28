from fastapi import FastAPI
from app.core.config import get_settings
from app.api import url as url_router
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.middleware import rate_limit_middleware
from app.api import auth as auth_router

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="URL shortener + analytics platform",
    version="1.0.0",
)

app.add_middleware(
    BaseHTTPMiddleware,
    dispatch=rate_limit_middleware,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": f"Welcome to {settings.APP_NAME}"}

@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}

app.include_router(url_router.router, tags=["URLs"])
app.include_router(auth_router.router)