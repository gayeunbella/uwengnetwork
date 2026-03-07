import json
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.user import UserPublic

VALID_STAGES = {"idea", "early_prototype", "working_prototype", "polished", "shipped"}
VALID_CATEGORIES = {"hardware", "software", "both"}
VALID_FIELDS = {
    "sustainability", "ai_ml", "healthcare", "robotics", "fintech",
    "embedded", "web", "mobile", "data", "security", "other",
}


def _parse_json_list(v) -> list:
    if isinstance(v, str):
        return json.loads(v)
    return v


class PostCreate(BaseModel):
    title: str
    body: str
    project_stage: str
    category: str
    tech_stack: list[str] = []
    field: list[str] = []

    @field_validator("title")
    @classmethod
    def title_max(cls, v: str) -> str:
        if len(v) > 100:
            raise ValueError("Title max 100 chars")
        return v

    @field_validator("body")
    @classmethod
    def body_max(cls, v: str) -> str:
        if len(v) > 2000:
            raise ValueError("Body max 2000 chars")
        return v

    @field_validator("project_stage")
    @classmethod
    def stage_valid(cls, v: str) -> str:
        if v not in VALID_STAGES:
            raise ValueError(f"project_stage must be one of {sorted(VALID_STAGES)}")
        return v

    @field_validator("category")
    @classmethod
    def category_valid(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(f"category must be one of {sorted(VALID_CATEGORIES)}")
        return v

    @field_validator("tech_stack")
    @classmethod
    def tech_stack_max(cls, v: list) -> list:
        if len(v) > 5:
            raise ValueError("tech_stack max 5 items")
        return v

    @field_validator("field")
    @classmethod
    def field_valid(cls, v: list) -> list:
        for f in v:
            if f not in VALID_FIELDS:
                raise ValueError(f"field value '{f}' must be one of {sorted(VALID_FIELDS)}")
        return v


class PostPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    author: UserPublic
    title: str
    body: str
    media: list[str]
    project_stage: str
    category: str
    tech_stack: list[str]
    field: list[str]
    created_at: datetime

    @field_validator("media", "tech_stack", "field", mode="before")
    @classmethod
    def parse_json_fields(cls, v):
        return _parse_json_list(v)


class PostAuthorView(PostPublic):
    """Returned to the post author only. Includes private stats."""
    view_count: int
    prof_view_count: int
    likes: list[UserPublic]


class PostListResponse(BaseModel):
    posts: list[PostPublic]
    total: int
    page: int
    page_size: int
