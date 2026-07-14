from fastapi import Request
from fastapi.responses import JSONResponse
from app.services.rate_limiter import is_rate_limited
from app.services.cache_service import get_cached_domain


# Primary app hostname — requests from this host skip custom-domain resolution
PRIMARY_HOST = None  # populated from settings at startup; set via init_middleware()


def init_primary_host(host: str) -> None:
    global PRIMARY_HOST
    PRIMARY_HOST = host


async def rate_limit_middleware(request: Request, call_next):
    if request.url.path.startswith("/shorten") or request.url.path.startswith("/api-keys"):
        client_ip = request.client.host
        api_key = request.headers.get("x-api-key")

        identifier = f"apikey:{api_key}" if api_key else f"ip:{client_ip}"
        limit = 200 if api_key else 20

        if is_rate_limited(identifier, limit=limit, window_seconds=60):
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Try again in 60 seconds."},
                headers={"Retry-After": "60"},
            )

    response = await call_next(request)
    return response


async def custom_domain_middleware(request: Request, call_next):
    """
    Resolve custom domains on every redirect request.

    Lookup chain:  Host header → Redis (domain:{hostname}) → Postgres → continue normally

    If the host is a verified custom domain, attach the resolved owner_user_id to
    request.state so the redirect handler can scope the slug lookup to that user.
    """
    host = request.headers.get("host", "").split(":")[0].lower()

    # Skip resolution for the primary app host
    if PRIMARY_HOST and host == PRIMARY_HOST:
        return await call_next(request)

    # Only attempt resolution for redirect paths (bare short-code paths)
    path = request.url.path
    if path.startswith("/api") or path.startswith("/auth") or path.startswith("/docs"):
        return await call_next(request)

    # Redis-first lookup
    owner_user_id = get_cached_domain(host)

    if owner_user_id is None:
        # Fallback: query Postgres and warm the cache
        try:
            from app.core.database import SessionLocal
            from app.models.custom_domain import CustomDomain
            from app.services.cache_service import cache_domain

            db = SessionLocal()
            try:
                domain_obj = db.query(CustomDomain).filter(
                    CustomDomain.domain == host,
                    CustomDomain.is_verified == True,  # noqa: E712
                ).first()
                if domain_obj:
                    owner_user_id = domain_obj.user_id
                    cache_domain(host, owner_user_id)
            finally:
                db.close()
        except Exception:
            pass  # Non-critical — fall through to normal resolution

    if owner_user_id is not None:
        request.state.custom_domain_owner_id = owner_user_id

    return await call_next(request)
