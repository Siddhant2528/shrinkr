from sqlalchemy.orm import Session
from app.models.tag import Tag
from app.models.url import URL


def get_user_tags(db: Session, user_id: int) -> list[Tag]:
    return db.query(Tag).filter(Tag.user_id == user_id).order_by(Tag.name).all()


def create_tag(db: Session, user_id: int, name: str, color: str = "#6366f1") -> Tag:
    tag = Tag(name=name, color=color, user_id=user_id)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def delete_tag(db: Session, tag_id: int, user_id: int) -> bool:
    tag = db.query(Tag).filter(Tag.id == tag_id,
                               Tag.user_id == user_id).first()
    if not tag:
        return False
    db.delete(tag)
    db.commit()
    return True


def set_link_tags(db: Session, url_obj: URL, tag_ids: list[int], user_id: int) -> URL:
    """Replace all tags on a link with the supplied tag_ids (must belong to user)."""
    tags = db.query(Tag).filter(Tag.id.in_(tag_ids),
                                Tag.user_id == user_id).all()
    url_obj.tags = tags
    db.commit()
    db.refresh(url_obj)
    return url_obj
