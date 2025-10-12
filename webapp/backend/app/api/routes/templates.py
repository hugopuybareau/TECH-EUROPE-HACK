from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from typing import Optional
from uuid import UUID
from app.db.session import get_db
from app.models.template import OnboardingTemplate, TemplateStatus
from app.models.user import User
from app.models.questionnaire import Questionnaire, ToolSet
from app.models.onboarding import OnboardingState
from app.schemas.template import OnboardingTemplateCreate, OnboardingTemplateUpdate, OnboardingTemplateResponse
from app.schemas.common import success_response, error_response
from app.api.deps import get_current_user, require_admin


router = APIRouter(prefix="/api/v1/templates", tags=["templates"])


@router.get("/")
async def get_templates(
    role_key: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(OnboardingTemplate).where(
        OnboardingTemplate.company_id == current_user.company_id
    )
    
    if role_key:
        query = query.where(OnboardingTemplate.role_key == role_key)
    
    result = await db.execute(query)
    templates = result.scalars().all()
    
    response = [OnboardingTemplateResponse.from_orm(t) for t in templates]
    return success_response([r.dict() for r in response])


@router.post("/")
async def create_template(
    template: OnboardingTemplateCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    db_template = OnboardingTemplate(
        company_id=current_user.company_id,
        name=template.name,
        role_key=template.role_key,
        part_ids=template.part_ids,
        status=TemplateStatus.DRAFT,
        version=1
    )
    
    db.add(db_template)
    await db.commit()
    await db.refresh(db_template)
    
    response = OnboardingTemplateResponse.from_orm(db_template)
    return success_response(response.dict())


@router.get("/{template_id}")
async def get_template(
    template_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(OnboardingTemplate).where(
            and_(
                OnboardingTemplate.id == template_id,
                OnboardingTemplate.company_id == current_user.company_id
            )
        )
    )
    template = result.scalar_one_or_none()
    
    if not template:
        return error_response("NOT_FOUND", "Template not found")
    
    response = OnboardingTemplateResponse.from_orm(template)
    return success_response(response.dict())

@router.patch("/{template_id}")
async def update_template(
    template_id: UUID,
    update: OnboardingTemplateUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(OnboardingTemplate).where(
            and_(
                OnboardingTemplate.id == template_id,
                OnboardingTemplate.company_id == current_user.company_id
            )
        )
    )
    template = result.scalar_one_or_none()

    if not template:
        return error_response("NOT_FOUND", "Template not found")

    update_data = update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    await db.commit()
    await db.refresh(template)

    response = OnboardingTemplateResponse.from_orm(template)
    return success_response(response.dict())


@router.post("/{template_id}/publish")
async def publish_template(
    template_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(OnboardingTemplate).where(
            and_(
                OnboardingTemplate.id == template_id,
                OnboardingTemplate.company_id == current_user.company_id
            )
        )
    )
    template = result.scalar_one_or_none()
    
    if not template:
        return error_response("NOT_FOUND", "Template not found")
    
    template.status = TemplateStatus.PUBLISHED
    await db.commit()
    await db.refresh(template)

    # Remove any other drafts with the same name and role for this company
    await db.execute(
        delete(OnboardingTemplate).where(
            and_(
                OnboardingTemplate.company_id == current_user.company_id,
                OnboardingTemplate.name == template.name,
                OnboardingTemplate.role_key == template.role_key,
                OnboardingTemplate.status == TemplateStatus.DRAFT,
                OnboardingTemplate.id != template.id,
            )
        )
    )
    await db.commit()
    
    return success_response({
        "id": template.id,
        "version": template.version,
        "status": template.status.value
    })


@router.delete("/{template_id}")
async def delete_template(
    template_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    # First verify the template exists and belongs to this company
    template_result = await db.execute(
        select(OnboardingTemplate).where(
            and_(
                OnboardingTemplate.id == template_id,
                OnboardingTemplate.company_id == current_user.company_id,
            )
        )
    )
    template = template_result.scalar_one_or_none()

    if not template:
        return error_response("NOT_FOUND", "Template not found")

    # Delete related onboarding states first
    await db.execute(
        delete(OnboardingState).where(
            and_(
                OnboardingState.template_id == template_id,
                OnboardingState.company_id == current_user.company_id,
            )
        )
    )

    # Get questionnaires related to this template
    questionnaires_result = await db.execute(
        select(Questionnaire.id).where(
            and_(
                Questionnaire.template_id == template_id,
                Questionnaire.company_id == current_user.company_id,
            )
        )
    )
    questionnaire_ids = [row[0] for row in questionnaires_result.all()]

    # Delete toolsets related to those questionnaires
    if questionnaire_ids:
        await db.execute(
            delete(ToolSet).where(
                and_(
                    ToolSet.questionnaire_id.in_(questionnaire_ids),
                    ToolSet.company_id == current_user.company_id,
                )
            )
        )

    # Delete questionnaires
    await db.execute(
        delete(Questionnaire).where(
            and_(
                Questionnaire.template_id == template_id,
                Questionnaire.company_id == current_user.company_id,
            )
        )
    )

    # Finally, delete the template itself
    await db.execute(
        delete(OnboardingTemplate).where(
            and_(
                OnboardingTemplate.id == template_id,
                OnboardingTemplate.company_id == current_user.company_id,
            )
        )
    )

    await db.commit()
    return success_response({"deleted": True})
