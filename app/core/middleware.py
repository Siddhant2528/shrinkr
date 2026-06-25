from fastapi import Request
from fastapi.responses import JSONResponse
from app.services.rate_limiter import is_rate_limited

async def rate_limit_middleware(request: Request, call_next):
    if request.url.path.startswith("/shorten") or request.url.path.startswith("/api-keys"):
        client_ip = request.client.host
        api_key = request.headers.get("x-api-key")

        identifier = f"apikey:{api_key}" if api_key else f"ip:{client_ip}"
        limit = 200 if api_key else 20

        if is_rate_limited(identifier, limit=limit, window_seconds=60):
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again in 60 seconds."},
                headers={"Retry-After": "60"},
            )

    response = await call_next(request)
    return response