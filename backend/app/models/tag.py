from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

# Join table (many-to-many: URLs ↔ Tags)
link_tags = Table(
    "link_tags",
    Base.metadata,
    Column("link_id", Integer, ForeignKey(
        "urls.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey(
        "tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    color = Column(String, default="#6366f1")  # hex colour
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="tags")
    urls = relationship("URL", secondary=link_tags, back_populates="tags")
