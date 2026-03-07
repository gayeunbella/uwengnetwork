from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    department: str
    year: str
    bio: str
    profile_picture: str
    is_verified: bool
    is_professor: bool
    created_at: datetime


class UserUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    bio: Optional[str] = None
