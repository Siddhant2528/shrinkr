import time
from app.core.redis import redis_client

def is_rate_limited(
    identifier: str,
    limit: int = 100,
    window_seconds: int = 60,
) -> bool:
    key = f"rate:{identifier}"
    now = time.time()
    window_start = now - window_seconds

    pipe = redis_client.pipeline()
    pipe.zremrangebyscore(key, 0, window_start)
    pipe.zcard(key)
    pipe.zadd(key, {str(now): now})
    pipe.expire(key, window_seconds)
    results = pipe.execute()

    request_count = results[1]
    return request_count >= limit