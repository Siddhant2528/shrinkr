"""
Structured logging configuration for Shrinkr.

In production (DEBUG=False):  JSON-like structured output, level=INFO
In development  (DEBUG=True): Human-readable coloured output, level=DEBUG
"""
import logging
import sys

def setup_logging(debug: bool = False, log_level: str = "INFO") -> None:
    """Configure root logger. Call once at application startup."""
    level = logging.DEBUG if debug else getattr(logging, log_level.upper(), logging.INFO)

    if debug:
        fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        datefmt = "%H:%M:%S"
    else:
        # Structured-ish format that log aggregators (Datadog, Papertrail, etc.) can parse
        fmt = '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}'
        datefmt = "%Y-%m-%dT%H:%M:%S"

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(fmt, datefmt=datefmt))

    root = logging.getLogger()
    root.setLevel(level)
    # Remove any existing handlers so we don't double-log
    root.handlers.clear()
    root.addHandler(handler)

    # Quiet noisy libraries in production
    if not debug:
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

def get_logger(name: str) -> logging.Logger:
    """Convenience wrapper — use in place of logging.getLogger()."""
    return logging.getLogger(name)
