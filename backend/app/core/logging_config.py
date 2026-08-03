"""
Structured logging configuration for Shrinkr.

In production (DEBUG=False):  Fully structured JSON output, level=INFO
                               Each log line is a single JSON object with:
                               - timestamp (ISO-8601 UTC)
                               - level, logger, message
                               - filename, lineno
                               - exc_info (full traceback, when present)
                               - any extra fields passed at call sites

In development  (DEBUG=True): Human-readable coloured output, level=DEBUG
"""
import json
import logging
import sys
import traceback
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """
    Formats each log record as a single-line JSON object suitable for
    ingestion by Datadog, AWS CloudWatch, the ELK stack, Papertrail, etc.
    """

    # Keys from LogRecord that we explicitly handle ourselves.
    # Everything else in record.__dict__ that isn't in this set gets
    # forwarded verbatim as an "extra" field — handy for structured context
    # added with logger.info("…", extra={"user_id": 42, "path": "/shorten"}).
    _BUILTIN_KEYS = frozenset({
        "args", "created", "exc_info", "exc_text", "filename",
        "funcName", "levelname", "levelno", "lineno", "message",
        "module", "msecs", "msg", "name", "pathname", "process",
        "processName", "relativeCreated", "stack_info", "taskName",
        "thread", "threadName",
    })

    def format(self, record: logging.LogRecord) -> str:
        record.message = record.getMessage()

        payload: dict = {
            "timestamp": datetime.fromtimestamp(
                record.created, tz=timezone.utc
            ).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.message,
            "filename": record.filename,
            "lineno": record.lineno,
        }

        # Attach full exception traceback when present
        if record.exc_info and record.exc_info[0] is not None:
            payload["exc_info"] = "".join(
                traceback.format_exception(*record.exc_info)
            ).rstrip()

        # Forward any user-supplied extra fields
        for key, value in record.__dict__.items():
            if key not in self._BUILTIN_KEYS and not key.startswith("_"):
                try:
                    json.dumps(value)   # guard: only serialisable values
                    payload[key] = value
                except (TypeError, ValueError):
                    payload[key] = repr(value)

        return json.dumps(payload, ensure_ascii=False)


def setup_logging(debug: bool = False, log_level: str = "INFO") -> None:
    """Configure root logger. Call once at application startup."""
    level = logging.DEBUG if debug else getattr(
        logging, log_level.upper(), logging.INFO)

    if debug:
        fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        datefmt = "%H:%M:%S"
        formatter: logging.Formatter = logging.Formatter(fmt, datefmt=datefmt)
    else:
        formatter = JSONFormatter()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

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
