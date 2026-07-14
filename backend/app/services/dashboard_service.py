from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.url import URL
from app.models.click import Click
from datetime import datetime, timezone, timedelta

def get_summary(db: Session) -> dict:
    url_stats = db.query(
        func.count(URL.id),
        func.sum(URL.clicks)
    ).first()

    total_urls = url_stats[0] or 0
    total_clicks = url_stats[1] or 0

    since = datetime.now(timezone.utc) - timedelta(hours=24)
    clicks_today = (
        db.query(func.count(Click.id))
        .filter(Click.clicked_at >= since)
        .scalar() or 0
    )

    active_urls = (
        db.query(func.count(URL.id))
        .filter(URL.is_active == True)
        .scalar() or 0
    )

    return {
        "total_urls": total_urls,
        "total_clicks": total_clicks,
        "clicks_today": clicks_today,
        "active_urls": active_urls,
    }

def get_top_links(db: Session, limit: int = 10) -> list:
    results = (
        db.query(URL)
        .filter(URL.is_active == True)
        .order_by(URL.clicks.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "short_code": url.short_code,
            "original_url": url.original_url,
            "clicks": url.clicks,
            "created_at": url.created_at,
        }
        for url in results
    ]

def get_country_breakdown(db: Session) -> dict:
    results = (
        db.query(Click.country, func.count(Click.id))
        .group_by(Click.country)
        .order_by(func.count(Click.id).desc())
        .limit(10)
        .all()
    )
    return {
        (country if country else "Unknown"): count
        for country, count in results
    }

def get_device_breakdown(db: Session) -> dict:
    results = (
        db.query(Click.device, func.count(Click.id))
        .group_by(Click.device)
        .order_by(func.count(Click.id).desc())
        .all()
    )
    return {
        (device if device else "Unknown"): count
        for device, count in results
    }

def get_recent_clicks(db: Session, limit: int = 10) -> list:
    results = (
        db.query(Click, URL.short_code)
        .join(URL, Click.url_id == URL.id)
        .order_by(Click.clicked_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "short_code": short_code,
            "country": click.country,
            "device": click.device,
            "browser": click.browser,
            "clicked_at": click.clicked_at,
        }
        for click, short_code in results
    ]