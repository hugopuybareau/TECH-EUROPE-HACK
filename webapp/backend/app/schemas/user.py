from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "dev"
    company_id: UUID


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    working_repo_id: Optional[UUID] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    role: str
    company_id: UUID
    created_at: datetime
    working_repo_id: Optional[UUID] = None
    
    class Config:
        from_attributes = True
