from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.questionnaire import Questionnaire, ToolSet
from app.models.template import OnboardingTemplate, TemplatePart
from app.models.user import User
from app.schemas.common import error_response, success_response
from app.schemas.questionnaire import ToolSetCreate, ToolSetResponse
from app.services.toolset_generator import generate_resolved_steps


router = APIRouter(prefix="/api/v1/toolsets", tags=["toolsets"])


@router.post("/")
async def create_toolset(
    request: ToolSetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get questionnaire
    result = await db.execute(
        select(Questionnaire).where(
            and_(
                Questionnaire.id == request.questionnaire_id,
                Questionnaire.company_id == current_user.company_id
            )
        )
    )
    questionnaire = result.scalar_one_or_none()
    
    if not questionnaire:
        return error_response("NOT_FOUND", "Questionnaire not found")

    # Fetch related template for questionnaire validation
    template_result = await db.execute(
        select(OnboardingTemplate).where(
            and_(
                OnboardingTemplate.id == questionnaire.template_id,
                OnboardingTemplate.company_id == current_user.company_id
            )
        )
    )
    template = template_result.scalar_one_or_none()

    if not template:
        return error_response("NOT_FOUND", "Template not found for questionnaire")

    template_parts: list[TemplatePart] = []

    if template.part_ids:
        parts_result = await db.execute(
            select(TemplatePart).where(
                and_(
                    TemplatePart.company_id == current_user.company_id,
                    TemplatePart.id.in_(template.part_ids)
                )
            )
        )
        parts_by_id = {part.id: part for part in parts_result.scalars().all()}
        template_parts = [
            parts_by_id[part_id]
            for part_id in template.part_ids
            if part_id in parts_by_id
        ]

    resolved_steps = await generate_resolved_steps(
        questionnaire.answers or {},
        template_parts
    )
    
    # Create toolset
    toolset = ToolSet(
        company_id=current_user.company_id,
        questionnaire_id=request.questionnaire_id,
        resolved_steps=resolved_steps
    )
    
    db.add(toolset)
    await db.commit()
    await db.refresh(toolset)
    
    response = ToolSetResponse.from_orm(toolset)
    return success_response(response.dict())
