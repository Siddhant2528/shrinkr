from sqlalchemy.orm import Session
from app.models.click import Click

def record_click(
    db: Session,
    url_id: int,
    ip_address: str,
    user_agent: str | None,
    referer: str | None,
):
    click = Click(
        url_id=url_id,
        ip_address=ip_address,
        user_agent=user_agent,
        referer=referer,
    )
    db.add(click)
    db.commit()