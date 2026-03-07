import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String

from app.database import Base


class Professor(Base):
    __tablename__ = "professors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    faculty = Column(String, nullable=False)
    research_interests = Column(String, default="[]")  # JSON array of strings
    email = Column(String, unique=True, index=True, nullable=False)
    profile_url = Column(String, default="")
    claimed = Column(Boolean, default=False)
    claimed_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    scraped_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
