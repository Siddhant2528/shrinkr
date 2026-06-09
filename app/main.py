from fastapi import FastAPI
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="URL shortener + analytics platform",
    version="1.0.0",
)

@app.get("/")
def root():
    return {"message": f"Welcome to {settings.APP_NAME}"}

@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}