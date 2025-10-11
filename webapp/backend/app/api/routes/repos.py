from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from app.db.session import get_db
from app.models.repo import Repo, RepoScan, RepoProvider, ScanStatus
from app.models.user import User
from app.schemas.repo import RepoCreate, RepoResponse, RepoScanResponse
from app.schemas.common import success_response, error_response
from app.api.deps import get_current_user, require_admin
from app.services.scan_services import scan_repository


router = APIRouter(prefix="/api/v1/repos", tags=["repos"])


@router.post("/")
async def create_repo(
    repo: RepoCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    db_repo = Repo(
        company_id=current_user.company_id,
        provider=RepoProvider(repo.provider),
        org=repo.org,
        name=repo.name,
        default_branch=repo.default_branch
    )
    
    db.add(db_repo)
    await db.commit()
    await db.refresh(db_repo)
    
    response = RepoResponse.from_orm(db_repo)
    return success_response(response.dict())


@router.get("/")
async def get_repos(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Repo).where(Repo.company_id == current_user.company_id)
    )
    repos = result.scalars().all()
    
    response = [RepoResponse.from_orm(r) for r in repos]
    return success_response([r.dict() for r in response])


@router.post("/{repo_id}/scan")
async def scan_repo(
    repo_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # Verify repo exists
    result = await db.execute(
        select(Repo).where(
            and_(
                Repo.id == repo_id,
                Repo.company_id == current_user.company_id
            )
        )
    )
    repo = result.scalar_one_or_none()
    
    if not repo:
        return error_response("NOT_FOUND", "Repository not found")
    
    # Create scan record
    scan = RepoScan(
        company_id=current_user.company_id,
        repo_id=repo_id,
        status=ScanStatus.QUEUED,
        summary={}
    )
    
    db.add(scan)
    await db.commit()
    await db.refresh(scan)
    
    # Start background task
    background_tasks.add_task(
        scan_repository,
        repo_id,
        scan.id,
        current_user.company_id
    )
    
    response = RepoScanResponse.from_orm(scan)
    return success_response(response.dict())


@router.get("/{repo_id}/scans/{scan_id}")
async def get_scan(
    repo_id: UUID,
    scan_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(RepoScan).where(
            and_(
                RepoScan.id == scan_id,
                RepoScan.repo_id == repo_id,
                RepoScan.company_id == current_user.company_id
            )
        )
    )
    scan = result.scalar_one_or_none()
    
    if not scan:
        return error_response("NOT_FOUND", "Scan not found")
    
    response = RepoScanResponse.from_orm(scan)
    return success_response(response.dict())