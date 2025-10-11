from sqlalchemy import Column, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from app.db.base import Base, TimestampMixin
import enum


class OnboardingStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"


class OnboardingState(Base, TimestampMixin):
    __tablename__ = "onboarding_states"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    template_id = Column(UUID(as_uuid=True), ForeignKey("onboarding_templates.id"), nullable=False)
    toolset_id = Column(UUID(as_uuid=True), ForeignKey("toolsets.id"), nullable=False)
    status = Column(Enum(OnboardingStatus), default=OnboardingStatus.ACTIVE, nullable=False)
    progress = Column(Integer, default=0, nullable=False)
    steps = Column(JSONB, default=list)