from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional
from uuid import UUID
import uuid
from app.db.session import get_db
from app.models.onboarding import OnboardingState, OnboardingStatus
from app.models.questionnaire import ToolSet
from app.models.event import Event
from app.models.user import User
from app.schemas.onboarding import OnboardingCreate, OnboardingResponse, StepValidate
from app.schemas.common import success_response, error_response
from app.api.deps import get_current_user


router = APIRouter(prefix="/api/v1/onboardings", tags=["onboardings"])


@router.post("/")
async def create_onboarding(
    request: OnboardingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get toolset to copy steps
    result = await db.execute(
        select(ToolSet).where(
            and_(
                ToolSet.id == request.toolset_id,
                ToolSet.company_id == current_user.company_id
            )
        )
    )
    toolset = result.scalar_one_or_none()
    
    if not toolset:
        return error_response("NOT_FOUND", "Toolset not found")
    
    # Create steps with status tracking
    steps = []
    for step in toolset.resolved_steps:
        steps.append({
            **step,
            "status": "pending",
            "started_at": None,
            "completed_at": None,
            "validation_result": None
        })
    
    # Create onboarding state
    onboarding = OnboardingState(
        company_id=current_user.company_id,
        user_id=request.user_id,
        template_id=request.template_id,
        toolset_id=request.toolset_id,
        status=OnboardingStatus.ACTIVE,
        progress=0,
        steps=steps
    )
    
    db.add(onboarding)
    await db.commit()
    await db.refresh(onboarding)
    
    response = OnboardingResponse.from_orm(onboarding)
    return success_response(response.dict())


@router.get("/")
async def get_onboardings(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(OnboardingState).where(
        OnboardingState.company_id == current_user.company_id
    )
    
    if status:
        query = query.where(OnboardingState.status == status)
    
    result = await db.execute(query)
    onboardings = result.scalars().all()
    
    response = [OnboardingResponse.from_orm(o) for o in onboardings]
    return success_response([r.dict() for r in response])


@router.get("/{onboarding_id}")
async def get_onboarding(
    onboarding_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(OnboardingState).where(
            and_(
                OnboardingState.id == onboarding_id,
                OnboardingState.company_id == current_user.company_id
            )
        )
    )
    onboarding = result.scalar_one_or_none()
    
    if not onboarding:
        return error_response("NOT_FOUND", "Onboarding not found")
    
    response = OnboardingResponse.from_orm(onboarding)
    return success_response(response.dict())


@router.post("/{onboarding_id}/steps/{step_id}/start")
async def start_step(
    onboarding_id: UUID,
    step_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(OnboardingState).where(
            and_(
                OnboardingState.id == onboarding_id,
                OnboardingState.company_id == current_user.company_id
            )
        )
    )
    onboarding = result.scalar_one_or_none()
    
    if not onboarding:
        return error_response("NOT_FOUND", "Onboarding not found")
    
    # Update step status
    for step in onboarding.steps:
        if step["id"] == step_id:
            step["status"] = "in_progress"
            step["started_at"] = str(uuid.uuid4())  # Would be datetime in production
            break
    
    await db.commit()
    await db.refresh(onboarding)
    
    return success_response({"started": True})


@router.post("/{onboarding_id}/steps/{step_id}/complete")
async def complete_step(
    onboarding_id: UUID,
    step_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(OnboardingState).where(
            and_(
                OnboardingState.id == onboarding_id,
                OnboardingState.company_id == current_user.company_id
            )
        )
    )
    onboarding = result.scalar_one_or_none()
    
    if not onboarding:
        return error_response("NOT_FOUND", "Onboarding not found")
    
    # Update step status
    for step in onboarding.steps:
        if step["id"] == step_id:
            step["status"] = "completed"
            step["completed_at"] = str(uuid.uuid4())  # Would be datetime in production
            break
    
    # Update progress
    completed_steps = sum(1 for s in onboarding.steps if s["status"] == "completed")
    total_steps = len(onboarding.steps)
    onboarding.progress = int(100 * completed_steps / total_steps) if total_steps > 0 else 0
    
    await db.commit()
    await db.refresh(onboarding)
    
    return success_response({"completed": True, "progress": onboarding.progress})


@router.post("/{onboarding_id}/steps/{step_id}/validate")
async def validate_step(
    onboarding_id: UUID,
    step_id: str,
    validation: StepValidate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(OnboardingState).where(
            and_(
                OnboardingState.id == onboarding_id,
                OnboardingState.company_id == current_user.company_id
            )
        )
    )
    onboarding = result.scalar_one_or_none()
    
    if not onboarding:
        return error_response("NOT_FOUND", "Onboarding not found")
    
    # Update step validation
    for step in onboarding.steps:
        if step["id"] == step_id:
            step["validation_result"] = {
                "status": validation.status,
                "details": validation.details
            }
            if validation.status == "passed":
                step["status"] = "completed"
            break
    
    # Update progress
    completed_steps = sum(1 for s in onboarding.steps if s["status"] == "completed")
    total_steps = len(onboarding.steps)
    onboarding.progress = int(100 * completed_steps / total_steps) if total_steps > 0 else 0
    
    # Create event
    event = Event(
        company_id=current_user.company_id,
        entity="onboarding_state",
        entity_id=onboarding_id,
        action="step_validated",
        payload={
            "step_id": step_id,
            "status": validation.status,
            "details": validation.details
        }
    )
    db.add(event)
    
    await db.commit()
    await db.refresh(onboarding)
    
    return success_response({
        "validated": True,
        "status": validation.status,
        "progress": onboarding.progress
    })