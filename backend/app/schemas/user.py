from datetime import datetime

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
    name: str | None = None
    department: str | None = None
    year: str | None = None
    bio: str | None = None
