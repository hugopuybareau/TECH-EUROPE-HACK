from pydantic import BaseModel
from uuid import UUID
from typing import Dict, Any
from datetime import datetime


class RepoCreate(BaseModel):
    provider: str  # "github" | "gitlab"
    org: str
    name: str
    default_branch: str


class RepoResponse(BaseModel):
    id: UUID
    company_id: UUID
    provider: str
    org: str
    name: str
    default_branch: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class RepoScanResponse(BaseModel):
    id: UUID
    company_id: UUID
    repo_id: UUID
    status: str
    summary: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TemplatePartData(BaseModel):
    title: str
    description: str
    role_key: str
    tags: list[str] = []
    fields: list[Dict[str, Any]] = []
    validators: list[Dict[str, Any]] = []


class ScanResultPayload(BaseModel):
    scan_id: UUID
    summary_markdown: str
    template_parts: list[TemplatePartData]