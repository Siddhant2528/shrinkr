from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.click import Click
from app.models.url import URL
from datetime import datetime, timedelta, timezone

def get_analytics(db: Session, url_id: int) -> dict:
    total_clicks = (
        db.query(func.count(Click.id))
        .filter(Click.url_id == url_id)
        .scalar()
    )

    country_results = (
        db.query(Click.country, func.count(Click.id))
        .filter(Click.url_id == url_id)
        .group_by(Click.country)
        .all()
    )
    clicks_by_country = {
        (country if country else "Unknown"): count
        for country, count in country_results
    }

    device_results = (
        db.query(Click.device, func.count(Click.id))
        .filter(Click.url_id == url_id)
        .group_by(Click.device)
        .all()
    )
    clicks_by_device = {
        (device if device else "Unknown"): count
        for device, count in device_results
    }

    browser_results = (
        db.query(Click.browser, func.count(Click.id))
        .filter(Click.url_id == url_id)
        .group_by(Click.browser)
        .all()
    )
    clicks_by_browser = {
        (browser if browser else "Unknown"): count
        for browser, count in browser_results
    }

    return {
        "total_clicks": total_clicks or 0,
        "clicks_by_country": clicks_by_country,
        "clicks_by_device": clicks_by_device,
        "clicks_by_browser": clicks_by_browser,
    }

def get_click_timeseries(db: Session, url_id: int, days: int = 30) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=days)

    results = (
        db.query(
            func.date(Click.clicked_at).label("date"),
            func.count(Click.id).label("count"),
        )
        .filter(Click.url_id == url_id)
        .filter(Click.clicked_at >= since)
        .group_by(func.date(Click.clicked_at))
        .order_by(func.date(Click.clicked_at))
        .all()
    )

    result_map = {str(row.date): row.count for row in results}

    timeseries = []
    for i in range(days):
        date = (since + timedelta(days=i)).strftime("%Y-%m-%d")
        timeseries.append({
            "date": date,
            "clicks": result_map.get(date, 0)
        })

    return {"timeseries": timeseries}   