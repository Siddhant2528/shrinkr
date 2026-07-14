from app.core.redis import redis_client

CACHE_TTL = 3600
DOMAIN_CACHE_TTL = 3600

# ─── URL cache ────────────────────────────────────────────────────────────────


def cache_url(short_code: str, original_url: str, url_id: int) -> None:
    redis_client.hset(f"url:{short_code}", mapping={
        "original_url": original_url,
        "url_id": str(url_id),
    })
    redis_client.expire(f"url:{short_code}", CACHE_TTL)


def get_cached_url(short_code: str) -> dict | None:
    data = redis_client.hgetall(f"url:{short_code}")
    if not data:
        return None
    return {
        "original_url": data["original_url"],
        "url_id": int(data["url_id"]),
    }


def invalidate_url(short_code: str) -> None:
    redis_client.delete(f"url:{short_code}")

# ─── Custom domain cache ───────────────────────────────────────────────────────
# Key pattern: domain:{hostname}  →  owner_user_id (string)


def cache_domain(hostname: str, owner_user_id: int, ttl: int = DOMAIN_CACHE_TTL) -> None:
    redis_client.set(f"domain:{hostname}", str(owner_user_id), ex=ttl)


def get_cached_domain(hostname: str) -> int | None:
    value = redis_client.get(f"domain:{hostname}")
    return int(value) if value is not None else None


def invalidate_domain(hostname: str) -> None:
    redis_client.delete(f"domain:{hostname}")
