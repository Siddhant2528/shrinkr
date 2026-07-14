from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.custom_domain import CustomDomain, VerificationType
from app.services import domain_service
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/domains", tags=["Custom Domains"])


class DomainCreate(BaseModel):
    domain: str
    verification_type: VerificationType = VerificationType.txt


class DomainResponse(BaseModel):
    id: int
    domain: str
    verification_token: str
    verification_type: VerificationType
    is_verified: bool
    created_at: datetime
    verified_at: datetime | None

    class Config:
        from_attributes = True


@router.post("", response_model=DomainResponse, status_code=201)
def add_domain(
    data: DomainCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a new custom domain and receive the DNS verification token."""
    # Check for duplicate
    existing = db.query(CustomDomain).filter(
        CustomDomain.domain == data.domain.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=409, detail="Domain already registered")

    return domain_service.create_domain(db, current_user.id, data.domain, data.verification_type)


@router.get("", response_model=list[DomainResponse])
def list_domains(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return domain_service.get_user_domains(db, current_user.id)


@router.delete("/{domain_id}", status_code=204)
def delete_domain(
    domain_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = domain_service.delete_domain(db, domain_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=404, detail="Domain not found or not yours")


@router.post("/{domain_id}/verify", response_model=DomainResponse)
def verify_domain(
    domain_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Perform DNS lookup to verify domain ownership.
    On success sets is_verified=True and caches in Redis.
    """
    domain_obj = domain_service.verify_domain(db, domain_id, current_user.id)
    if domain_obj is None:
        raise HTTPException(
            status_code=404, detail="Domain not found or not yours")
    if not domain_obj.is_verified:
        raise HTTPException(
            status_code=422,
            detail=(
                "DNS verification failed. Ensure the TXT record or CNAME is correctly "
                "configured and DNS has propagated (may take up to 48 hours)."
            ),
        )
    return domain_obj
