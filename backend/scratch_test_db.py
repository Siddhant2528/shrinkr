from sqlalchemy import create_engine
import sys

db_urls = [
    "postgresql://shrinkr_user:shrinkr_pass@localhost:5432/shrinkr_db",
    "postgresql://postgres:postgres@localhost:5432/shrinkr_db",
    "postgresql://postgres:postgres@localhost:5432/postgres",
]

for url in db_urls:
    try:
        print(f"Testing connection to {url}...")
        engine = create_engine(url)
        conn = engine.connect()
        print("Success!")
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"Failed: {e}")

sys.exit(1)
