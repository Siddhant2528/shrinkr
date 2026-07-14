from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy.orm import relationship

class URL(Base):
    __tablename__ = "urls"

    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(String, nullable=False)
    short_code = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    clicks = Column(Integer, default=0)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    click_events = relationship("Click", back_populates="url")
    owner = relationship("User", back_populates="urls")
    tags = relationship("Tag", secondary="link_tags", back_populates="urls")