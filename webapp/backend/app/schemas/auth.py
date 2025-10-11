from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenData(BaseModel):
    sub: Optional[str] = None
    company_id: Optional[str] = None
    role: Optional[str] = None


class UserInfo(BaseModel):
    id: UUID
    email: str
    name: str
    role: str
    company_id: UUID


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo