from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.user import UserPublic


class MessageSend(BaseModel):
    body: str

    @field_validator("body")
    @classmethod
    def body_max(cls, v: str) -> str:
        if len(v) > 5000:
            raise ValueError("Body max 5000 chars")
        return v


class MessagePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sender: UserPublic
    receiver: UserPublic
    body: str
    is_read: bool
    created_at: datetime


class ThreadPreview(BaseModel):
    other_user: UserPublic
    last_message: MessagePublic
    unread_count: int
