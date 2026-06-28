from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = ""


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class LoginMFAComplete(BaseModel):
    email: EmailStr
    password: str
    code: str


class MFARequiredResponse(BaseModel):
    mfa_required: bool = True
    email: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    mfa_enabled: bool = False

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
