#!/bin/bash
set -e

# ─── Require mandatory production secrets ─────────────────────────────────────
if [ -z "$DEFAULT_ADMIN_PASSWORD" ]; then
  echo "ERROR: DEFAULT_ADMIN_PASSWORD environment variable is not set."
  echo "Set it to a secure password in your deployment environment."
  exit 1
fi

# ─── Run database migrations ──────────────────────────────────────────────────
echo "Running migrations..."
alembic upgrade head

# ─── Create/verify default admin account ─────────────────────────────────────
echo "Setting up admin account..."
python -c "
import os
import logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger('startup')

from app.core.database import SessionLocal
from app.models.user import User
from app.models.url import URL
from app.models.click import Click
from app.models.api_key import APIKey
from app.services.auth_service import hash_password

db = SessionLocal()

admin_email = os.environ['DEFAULT_ADMIN_EMAIL'] if 'DEFAULT_ADMIN_EMAIL' in os.environ else 'admin@shrinkr.com'
admin_user = os.environ['DEFAULT_ADMIN_USERNAME'] if 'DEFAULT_ADMIN_USERNAME' in os.environ else 'admin'
admin_password = os.environ['DEFAULT_ADMIN_PASSWORD']  # Required — already validated above

admin = db.query(User).filter(User.email == admin_email).first()
if not admin:
    admin = User(
        email=admin_email,
        username=admin_user,
        hashed_password=hash_password(admin_password),
        is_admin=True,
        is_active=True,
        is_verified=True,
    )
    db.add(admin)
    db.commit()
    logger.info('Admin account created: %s', admin_user)
else:
    admin.is_admin = True
    db.commit()
    logger.info('Admin account verified: %s', admin_user)

db.close()
"

# ─── Start server ─────────────────────────────────────────────────────────────
echo "Starting server..."
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 2 \
  --no-access-log