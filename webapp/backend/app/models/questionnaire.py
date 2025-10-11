from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime
from app.db.base import Base


class Questionnaire(Base):
    __tablename__ = "questionnaires"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("onboarding_templates.id"), nullable=False)
    fields = Column(JSONB, default=list)
    answers = Column(JSONB, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ToolSet(Base):
    __tablename__ = "toolsets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    questionnaire_id = Column(UUID(as_uuid=True), ForeignKey("questionnaires.id"), nullable=False)
    resolved_steps = Column(JSONB, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)