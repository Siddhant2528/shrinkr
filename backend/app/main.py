from fastapi import FastAPI
from app.core.config import get_settings
from app.core.logging_config import setup_logging, get_logger
from app.api import url as url_router
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.core.middleware import rate_limit_middleware, custom_domain_middleware, init_primary_host, structured_logging_middleware
from app.api import auth as auth_router
from app.api import tags as tags_router
from app.api import domains as domains_router

settings = get_settings()

# Initialise logging before anything else
setup_logging(debug=settings.DEBUG, log_level=settings.LOG_LEVEL)
logger = get_logger(__name__)

# Tell the middleware what the primary host is so it can skip itself
try:
    from urllib.parse import urlparse
    _parsed = urlparse(settings.BASE_URL)
    init_primary_host(_parsed.hostname or "")
except Exception:
    pass

# ─── FastAPI app ───

app = FastAPI(
    title=settings.APP_NAME,
    description="URL shortener + analytics platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ─── Security headers middleware ───────


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if not settings.DEBUG:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# ─── Structured request/response logging (outermost — wraps everything) ──────

app.add_middleware(
    BaseHTTPMiddleware,
    dispatch=structured_logging_middleware,
)

# ─── Custom domain middleware runs first (outermost) ───

app.add_middleware(
    BaseHTTPMiddleware,
    dispatch=custom_domain_middleware,
)

app.add_middleware(
    BaseHTTPMiddleware,
    dispatch=rate_limit_middleware,
)

# ─── CORS ───

# Always allow the configured FRONTEND_URL.
# In dev (DEBUG=True) also allow localhost variants for convenience.
allowed_origins = [settings.FRONTEND_URL]
if settings.DEBUG:
    allowed_origins += [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    # Deduplicate
    allowed_origins = list(dict.fromkeys(allowed_origins))

if settings.DEBUG:
    logger.info("CORS allowed origins: %s", allowed_origins)
else:
    logger.info("CORS locked to: %s", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ────


@app.get("/")
def root():
    return {"message": f"Welcome to {settings.APP_NAME}"}


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}


app.include_router(auth_router.router)
app.include_router(tags_router.router)
app.include_router(domains_router.router)
app.include_router(url_router.router, tags=["URLs"])
