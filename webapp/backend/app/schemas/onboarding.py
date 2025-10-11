from pydantic import BaseModel
from uuid import UUID
from typing import List, Dict, Any, Optional
from datetime import datetime


class OnboardingCreate(BaseModel):
    user_id: UUID
    template_id: UUID
    toolset_id: UUID


class OnboardingResponse(BaseModel):
    id: UUID
    company_id: UUID
    user_id: UUID
    template_id: UUID
    toolset_id: UUID
    status: str
    progress: int
    steps: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class StepValidate(BaseModel):
    status: str  # "passed" | "failed"
    details: Optional[Dict[str, Any]] = None