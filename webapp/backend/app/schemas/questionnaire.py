from pydantic import BaseModel
from uuid import UUID
from typing import List, Dict, Any
from datetime import datetime


class QuestionnaireCreate(BaseModel):
    template_id: UUID
    user_id: UUID


class QuestionnaireResponse(BaseModel):
    id: UUID
    company_id: UUID
    template_id: UUID
    fields: List[Dict[str, Any]]
    answers: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AnswersUpdate(BaseModel):
    answers: Dict[str, Any]


class ToolSetCreate(BaseModel):
    questionnaire_id: UUID


class ToolSetResponse(BaseModel):
    id: UUID
    company_id: UUID
    questionnaire_id: UUID
    resolved_steps: List[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True