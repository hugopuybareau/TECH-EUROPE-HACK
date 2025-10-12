from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
import httpx
from app.db.session import get_db
from app.models.repo import Repo, RepoScan, RepoProvider, ScanStatus
from app.models.user import User
from app.models.template import TemplatePart
from app.schemas.repo import RepoCreate, RepoResponse, RepoScanResponse, ScanResultPayload
from app.schemas.common import success_response, error_response
from app.api.deps import get_current_user, require_admin
from app.core.config import settings


router = APIRouter(prefix="/api/v1/repos", tags=["repos"])


async def notify_n8n(scan_id: UUID, repo_id: UUID, repo: Repo):
    """
    Notify n8n webhook to start repo scanning workflow
    """
    print(f"[N8N] Starting notification for scan_id={scan_id}, repo_id={repo_id}")
    print(f"[N8N] N8N_WEBHOOK_URL configured: {bool(settings.N8N_WEBHOOK_URL)}")

    if not settings.N8N_WEBHOOK_URL or settings.N8N_WEBHOOK_URL == "read-it-from-env":
        print("[N8N] WARNING: N8N_WEBHOOK_URL not configured! Skipping n8n notification.")
        print("[N8N] Please set N8N_WEBHOOK_URL in your .env file")
        return

    # Construct repo URL based on provider
    if repo.provider.value == "github":
        repo_url = f"https://github.com/{repo.org}/{repo.name}.git"
    elif repo.provider.value == "gitlab":
        repo_url = f"https://gitlab.com/{repo.org}/{repo.name}.git"
    else:
        repo_url = f"https://{repo.provider.value}.com/{repo.org}/{repo.name}.git"

    payload = {
        "scan_id": str(scan_id),
        "repo_id": str(repo_id),
        "provider": repo.provider.value,
        "org": repo.org,
        "name": repo.name,
        "default_branch": repo.default_branch,
        "repo_url": repo_url
    }

    print(f"[N8N] Webhook URL: {settings.N8N_WEBHOOK_URL}")
    print(f"[N8N] Payload: {payload}")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            print("[N8N] Sending POST request to n8n...")
            response = await client.post(settings.N8N_WEBHOOK_URL, json=payload)
            print(f"[N8N] Response status: {response.status_code}")
            print(f"[N8N] Response body: {response.text[:500]}")  # First 500 chars

            if response.status_code >= 400:
                print(f"[N8N] ERROR: n8n webhook returned error status {response.status_code}")
            else:
                print("[N8N] SUCCESS: n8n webhook triggered successfully")
    except httpx.TimeoutException:
        print("[N8N] ERROR: Request to n8n timed out after 10 seconds")
    except httpx.ConnectError as e:
        print(f"[N8N] ERROR: Could not connect to n8n webhook: {e}")
    except Exception as e:
        print(f"[N8N] ERROR: Failed to notify n8n: {type(e).__name__}: {e}")


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

    # Create scan record with QUEUED status
    scan = RepoScan(
        company_id=current_user.company_id,
        repo_id=repo_id,
        status=ScanStatus.QUEUED,
        summary={}
    )

    db.add(scan)
    await db.commit()
    await db.refresh(scan)

    # Trigger n8n workflow
    await notify_n8n(scan.id, repo_id, repo)

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


@router.post("/scanresult")
async def receive_scan_result(
    payload: ScanResultPayload,
    db: AsyncSession = Depends(get_db)
):
    # Fetch the scan record
    result = await db.execute(
        select(RepoScan).where(RepoScan.id == payload.scan_id)
    )
    scan = result.scalar_one_or_none()

    if not scan:
        return error_response("NOT_FOUND", "Scan not found")

    # Update scan status and summary
    scan.status = ScanStatus.DONE
    scan.summary = {"markdown": payload.summary_markdown}

    # Create TemplatePart objects from the scan results
    created_parts = []
    for part_data in payload.template_parts:
        template_part = TemplatePart(
            company_id=scan.company_id,
            title=part_data.title,
            description=part_data.description,
            role_key=part_data.role_key,
            tags=part_data.tags,
            fields=part_data.fields,
            validators=part_data.validators
        )
        db.add(template_part)
        created_parts.append(template_part)

    await db.commit()
    await db.refresh(scan)

    # Refresh all created parts to get their IDs
    for part in created_parts:
        await db.refresh(part)

    return success_response({
        "scan_id": str(scan.id),
        "status": scan.status.value,
        "created_parts": [str(part.id) for part in created_parts]
    })

