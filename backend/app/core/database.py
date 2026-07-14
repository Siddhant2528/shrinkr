from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import get_settings

settings = get_settings()

# SQLite doesn't support connection pooling arguments — only use them for Postgres
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if _is_sqlite:
    # Minimal config for SQLite (used in tests)
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=5,           # Maintain up to 5 persistent connections
        max_overflow=10,       # Allow up to 10 extra connections under load
        pool_timeout=30,       # Wait max 30s for a connection before erroring
        pool_recycle=1800,     # Recycle connections after 30 min (avoids stale connections)
        pool_pre_ping=True,    # Test connections before use (handles DB restarts gracefully)
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()