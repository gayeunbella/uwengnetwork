from pydantic import BaseModel, field_validator

from app.schemas.user import UserPublic


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    department: str
    year: str

    @field_validator("email")
    @classmethod
    def email_must_be_uwaterloo(cls, v: str) -> str:
        if not v.endswith("@uwaterloo.ca"):
            raise ValueError("Email must be a @uwaterloo.ca address")
        return v.lower()

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("year")
    @classmethod
    def year_valid(cls, v: str) -> str:
        if v not in {"1", "2", "3", "4", "5", "grad"}:
            raise ValueError("Year must be 1-5 or grad")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class WatcardVerifyResponse(BaseModel):
    is_engineering: bool
    confidence: float
    extracted_text: str
