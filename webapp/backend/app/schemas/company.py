from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class CompanyResponse(BaseModel):
    id: UUID
    name: str
    domain: str
    default_role: str | None = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class CompanyUpdate(BaseModel):
    name: str | None = None
    domain: str | None = None
    default_role: str | None = None
