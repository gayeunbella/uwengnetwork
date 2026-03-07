import json

from pydantic import BaseModel, ConfigDict, field_validator


class ProfessorPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    department: str
    faculty: str
    research_interests: list[str]
    email: str
    profile_url: str
    claimed: bool

    @field_validator("research_interests", mode="before")
    @classmethod
    def parse_json(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v


class ProfessorListResponse(BaseModel):
    professors: list[ProfessorPublic]
    total: int
    page: int
    page_size: int
