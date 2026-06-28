#!/bin/bash
echo "Running migrations..."
alembic upgrade head

echo "Creating default admin..."
python -c "
from app.core.database import SessionLocal
from app.models.user import User
from app.services.auth_service import hash_password

db = SessionLocal()
admin = db.query(User).filter(User.email == 'siddhant@gmail.com').first()
if not admin:
    admin = User(
        email='siddhant@gmail.com',
        username='siddhant',
        hashed_password=hash_password('password123'),
        is_admin=True,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    print('Admin created')
else:
    admin.is_admin = True
    db.commit()
    print('Admin updated')
db.close()
"

echo "Starting server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000