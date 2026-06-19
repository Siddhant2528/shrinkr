from sqlalchemy.orm import Session
from app.models.click import Click
from user_agents import parse
from app.services.geo_service import get_country

def parse_user_agent(user_agent_string: str | None) -> tuple[str | None, str | None]:
    if not user_agent_string:
        return None, None

    ua = parse(user_agent_string)

    browser = ua.browser.family

    if ua.is_mobile:
        device = "Mobile"
    elif ua.is_tablet:
        device = "Tablet"
    elif ua.is_pc:
        device = "Desktop"
    else:
        device = "Other"

    return browser, device

def record_click(
    db: Session,
    url_id: int,
    ip_address: str,
    user_agent: str | None,
    referer: str | None,
):
    browser, device = parse_user_agent(user_agent)
    country = get_country(ip_address)

    click = Click(
        url_id=url_id,
        ip_address=ip_address,
        user_agent=user_agent,
        referer=referer,
        browser=browser,
        device=device,
        country=country,
    )
    db.add(click)
    db.commit()