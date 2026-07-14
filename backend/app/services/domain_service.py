import secrets
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.custom_domain import CustomDomain, VerificationType
from app.services.cache_service import cache_domain, invalidate_domain

try:
    import dns.resolver
    DNS_AVAILABLE = True
except ImportError:
    DNS_AVAILABLE = False


def _generate_token() -> str:
    return f"shrinkr-verify-{secrets.token_urlsafe(24)}"


def create_domain(
    db: Session,
    user_id: int,
    domain: str,
    verification_type: VerificationType = VerificationType.txt,
) -> CustomDomain:
    """Register a new custom domain and generate its verification token."""
    token = _generate_token()
    domain_obj = CustomDomain(
        user_id=user_id,
        domain=domain.lower().strip(),
        verification_token=token,
        verification_type=verification_type,
    )
    db.add(domain_obj)
    db.commit()
    db.refresh(domain_obj)
    return domain_obj


def get_user_domains(db: Session, user_id: int) -> list[CustomDomain]:
    return (
        db.query(CustomDomain)
        .filter(CustomDomain.user_id == user_id)
        .order_by(CustomDomain.created_at.desc())
        .all()
    )


def delete_domain(db: Session, domain_id: int, user_id: int) -> bool:
    domain_obj = db.query(CustomDomain).filter(
        CustomDomain.id == domain_id,
        CustomDomain.user_id == user_id,
    ).first()
    if not domain_obj:
        return False
    invalidate_domain(domain_obj.domain)
    db.delete(domain_obj)
    db.commit()
    return True


def _check_txt_record(domain: str, token: str) -> bool:
    """Return True if a DNS TXT record containing the token exists."""
    if not DNS_AVAILABLE:
        # dnspython not installed — skip real check in dev
        return False
    try:
        answers = dns.resolver.resolve(domain, "TXT")
        for rdata in answers:
            for txt_string in rdata.strings:
                if token.encode() in txt_string or token in txt_string.decode("utf-8", errors="ignore"):
                    return True
    except Exception:
        pass
    return False


def _check_cname_record(domain: str) -> bool:
    """Return True if the domain CNAME points to cname.shrinkr.com."""
    if not DNS_AVAILABLE:
        return False
    try:
        answers = dns.resolver.resolve(domain, "CNAME")
        for rdata in answers:
            if "cname.shrinkr.com" in str(rdata.target).lower():
                return True
    except Exception:
        pass
    return False


def verify_domain(db: Session, domain_id: int, user_id: int) -> CustomDomain | None:
    """
    Run DNS verification. On success:
      - sets is_verified=True, verified_at=now
      - writes domain:{hostname} → user_id into Redis
    Returns the updated domain object, or None if not found / verification fails.
    """
    domain_obj = db.query(CustomDomain).filter(
        CustomDomain.id == domain_id,
        CustomDomain.user_id == user_id,
    ).first()
    if not domain_obj:
        return None

    if domain_obj.verification_type == VerificationType.txt:
        verified = _check_txt_record(
            domain_obj.domain, domain_obj.verification_token)
    else:
        verified = _check_cname_record(domain_obj.domain)

    if not verified:
        return domain_obj  # caller checks is_verified to detect failure

    domain_obj.is_verified = True
    domain_obj.verified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(domain_obj)

    # Warm Redis cache so redirects never hit the DB
    cache_domain(domain_obj.domain, domain_obj.user_id)

    return domain_obj
