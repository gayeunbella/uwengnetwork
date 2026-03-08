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


class ProfessorCreate(BaseModel):
    name: str
    department: str
    research_interests: list[str] = []
    profile_url: str = ""


class ProfessorUpdate(BaseModel):
    name: str | None = None
    department: str | None = None
    research_interests: list[str] | None = None
    profile_url: str | None = None


class ProfessorListResponse(BaseModel):
    professors: list[ProfessorPublic]
    total: int
    page: int
    page_size: int
