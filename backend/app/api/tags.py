from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.services import tag_service
from app.models.url import URL
from pydantic import BaseModel

router = APIRouter(prefix="/tags", tags=["Tags"])


class TagCreate(BaseModel):
    name: str
    color: str = "#6366f1"


class TagResponse(BaseModel):
    id: int
    name: str
    color: str

    class Config:
        from_attributes = True


class SetTagsRequest(BaseModel):
    tag_ids: list[int]


@router.get("", response_model=list[TagResponse])
def list_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return tag_service.get_user_tags(db, current_user.id)


@router.post("", response_model=TagResponse, status_code=201)
def create_tag(
    data: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return tag_service.create_tag(db, current_user.id, data.name, data.color)


@router.delete("/{tag_id}", status_code=204)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = tag_service.delete_tag(db, tag_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=404, detail="Tag not found or not yours")


@router.put("/links/{short_code}", response_model=list[TagResponse])
def set_link_tags(
    short_code: str,
    data: SetTagsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url_obj = db.query(URL).filter(
        URL.short_code == short_code,
        URL.user_id == current_user.id,
    ).first()
    if not url_obj:
        raise HTTPException(
            status_code=404, detail="Link not found or not yours")
    url_obj = tag_service.set_link_tags(
        db, url_obj, data.tag_ids, current_user.id)
    return url_obj.tags
