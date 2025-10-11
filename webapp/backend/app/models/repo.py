from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime
from app.db.base import Base, TimestampMixin
import enum


class RepoProvider(str, enum.Enum):
    GITHUB = "github"
    GITLAB = "gitlab"


class ScanStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    DONE = "done"
    ERROR = "error"


class Repo(Base):
    __tablename__ = "repos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    provider = Column(Enum(RepoProvider), nullable=False)
    org = Column(String, nullable=False)
    name = Column(String, nullable=False)
    default_branch = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class RepoScan(Base, TimestampMixin):
    __tablename__ = "repo_scans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    repo_id = Column(UUID(as_uuid=True), ForeignKey("repos.id"), nullable=False)
    status = Column(Enum(ScanStatus), default=ScanStatus.QUEUED, nullable=False)
    summary = Column(JSONB, default=dict)