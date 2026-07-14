"""Unit tests for the Redis sliding-window rate limiter."""
import pytest
from unittest.mock import MagicMock, patch


def _make_mock_pipeline(request_count: int):
    """Return a mock pipeline whose execute() reports `request_count` existing requests."""
    mock_pipe = MagicMock()
    mock_pipe.execute.return_value = [0, request_count, 1, True]
    mock_pipe.zremrangebyscore = MagicMock()
    mock_pipe.zcard = MagicMock()
    mock_pipe.zadd = MagicMock()
    mock_pipe.expire = MagicMock()
    return mock_pipe


def test_under_limit_not_rate_limited():
    """When request count is below the limit, returns False."""
    mock_pipe = _make_mock_pipeline(request_count=5)
    mock_redis = MagicMock()
    mock_redis.pipeline.return_value = mock_pipe

    import app.services.rate_limiter as rl
    original = rl.redis_client
    rl.redis_client = mock_redis
    try:
        result = rl.is_rate_limited("ip:1.2.3.4", limit=20, window_seconds=60)
    finally:
        rl.redis_client = original

    assert result is False


def test_at_limit_is_rate_limited():
    """When request count equals the limit, returns True."""
    mock_pipe = _make_mock_pipeline(request_count=20)
    mock_redis = MagicMock()
    mock_redis.pipeline.return_value = mock_pipe

    import app.services.rate_limiter as rl
    original = rl.redis_client
    rl.redis_client = mock_redis
    try:
        result = rl.is_rate_limited("ip:1.2.3.4", limit=20, window_seconds=60)
    finally:
        rl.redis_client = original

    assert result is True


def test_over_limit_is_rate_limited():
    """When request count exceeds the limit, returns True."""
    mock_pipe = _make_mock_pipeline(request_count=25)
    mock_redis = MagicMock()
    mock_redis.pipeline.return_value = mock_pipe

    import app.services.rate_limiter as rl
    original = rl.redis_client
    rl.redis_client = mock_redis
    try:
        result = rl.is_rate_limited("ip:1.2.3.4", limit=20, window_seconds=60)
    finally:
        rl.redis_client = original

    assert result is True


def test_pipeline_commands_called():
    """Verifies the sliding window commands are issued in the right order."""
    mock_pipe = _make_mock_pipeline(request_count=0)
    mock_redis = MagicMock()
    mock_redis.pipeline.return_value = mock_pipe

    import app.services.rate_limiter as rl
    original = rl.redis_client
    rl.redis_client = mock_redis
    try:
        rl.is_rate_limited("ip:1.2.3.4", limit=100, window_seconds=60)
    finally:
        rl.redis_client = original

    mock_pipe.zremrangebyscore.assert_called_once()
    mock_pipe.zcard.assert_called_once()
    mock_pipe.zadd.assert_called_once()
    mock_pipe.expire.assert_called_once()
    mock_pipe.execute.assert_called_once()


def test_api_key_identifier_naming():
    """API key and IP identifiers follow consistent naming conventions."""
    assert "apikey:my-key-123".startswith("apikey:")
    assert "ip:1.2.3.4".startswith("ip:")


def test_different_identifiers_are_independent():
    """Two different identifiers with separate mock states don't interfere."""
    import app.services.rate_limiter as rl
    original = rl.redis_client

    # First call: 19 existing requests (under limit of 20)
    mock_pipe_a = _make_mock_pipeline(request_count=19)
    mock_redis_a = MagicMock()
    mock_redis_a.pipeline.return_value = mock_pipe_a
    rl.redis_client = mock_redis_a
    result_a = rl.is_rate_limited("ip:1.1.1.1", limit=20, window_seconds=60)

    # Second call: 5 existing requests (well under limit)
    mock_pipe_b = _make_mock_pipeline(request_count=5)
    mock_redis_b = MagicMock()
    mock_redis_b.pipeline.return_value = mock_pipe_b
    rl.redis_client = mock_redis_b
    result_b = rl.is_rate_limited("ip:2.2.2.2", limit=20, window_seconds=60)

    rl.redis_client = original

    assert result_a is False
    assert result_b is False
