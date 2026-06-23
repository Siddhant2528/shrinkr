from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.click import Click
from app.models.url import URL

def get_analytics(db: Session, url_id: int) -> dict:
    total_clicks = db.query(func.count(Click.id)).filter(Click.url_id == url_id).scalar()

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

    return {
        "total_clicks": total_clicks or 0,
        "clicks_by_country": clicks_by_country,
        "clicks_by_device": clicks_by_device,
    }