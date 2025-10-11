from pydantic import BaseModel
from uuid import UUID
from typing import List, Optional, Any, Dict
from datetime import datetime


class TemplatePartCreate(BaseModel):
    title: str
    description: Optional[str] = None
    role_key: str
    tags: List[str] = []
    fields: List[Dict[str, Any]] = []
    validators: List[Dict[str, Any]] = []


class TemplatePartUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    role_key: Optional[str] = None
    tags: Optional[List[str]] = None
    fields: Optional[List[Dict[str, Any]]] = None
    validators: Optional[List[Dict[str, Any]]] = None


class TemplatePartResponse(BaseModel):
    id: UUID
    company_id: UUID
    title: str
    description: Optional[str]
    role_key: str
    tags: List[str]
    fields: List[Dict[str, Any]]
    validators: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class OnboardingTemplateCreate(BaseModel):
    name: str
    role_key: str
    part_ids: List[UUID] = []


class OnboardingTemplateUpdate(BaseModel):
    name: Optional[str] = None
    role_key: Optional[str] = None
    part_ids: Optional[List[UUID]] = None


class OnboardingTemplateResponse(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    role_key: str
    part_ids: List[UUID]
    status: str
    version: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
