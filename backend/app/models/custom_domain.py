import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class VerificationType(str, enum.Enum):
    txt = "txt"
    cname = "cname"


class CustomDomain(Base):
    __tablename__ = "custom_domains"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    domain = Column(String, unique=True, nullable=False, index=True)
    verification_token = Column(String, nullable=False)
    verification_type = Column(Enum(VerificationType), default=VerificationType.txt, nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    verified_at = Column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", back_populates="custom_domains")
