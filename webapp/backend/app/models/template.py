from sqlalchemy import Column, String, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
import uuid
from app.db.base import Base, TimestampMixin
import enum


class TemplateStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class TemplatePart(Base, TimestampMixin):
    __tablename__ = "template_parts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    role_key = Column(String, nullable=False)
    tags = Column(JSONB, default=list)
    fields = Column(JSONB, default=list)
    validators = Column(JSONB, default=list)


class OnboardingTemplate(Base, TimestampMixin):
    __tablename__ = "onboarding_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    role_key = Column(String, nullable=False)
    part_ids = Column(ARRAY(UUID(as_uuid=True)), default=list)
    status = Column(Enum(TemplateStatus), default=TemplateStatus.DRAFT, nullable=False)
    version = Column(Integer, default=1, nullable=False)