from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from app.db.session import get_db
from app.models.questionnaire import Questionnaire
from app.models.template import OnboardingTemplate, TemplatePart
from app.models.user import User
from app.schemas.questionnaire import QuestionnaireCreate, QuestionnaireResponse, AnswersUpdate
from app.schemas.common import success_response, error_response
from app.api.deps import get_current_user


router = APIRouter(prefix="/api/v1/questionnaires", tags=["questionnaires"])


@router.post("/")
async def create_questionnaire(
    request: QuestionnaireCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get template
    result = await db.execute(
        select(OnboardingTemplate).where(
            and_(
                OnboardingTemplate.id == request.template_id,
                OnboardingTemplate.company_id == current_user.company_id
            )
        )
    )
    template = result.scalar_one_or_none()
    
    if not template:
        return error_response("NOT_FOUND", "Template not found")
    
    # Get template parts and build fields
    fields = []
    if template.part_ids:
        result = await db.execute(
            select(TemplatePart).where(
                and_(
                    TemplatePart.id.in_(template.part_ids),
                    TemplatePart.company_id == current_user.company_id
                )
            )
        )
        parts = result.scalars().all()
        
        for part in parts:
            if part.fields:
                fields.extend(part.fields)
    
    # Create questionnaire
    questionnaire = Questionnaire(
        company_id=current_user.company_id,
        template_id=request.template_id,
        fields=fields,
        answers={}
    )
    
    db.add(questionnaire)
    await db.commit()
    await db.refresh(questionnaire)
    
    response = QuestionnaireResponse.from_orm(questionnaire)
    return success_response(response.dict())


@router.post("/{questionnaire_id}/answers")
async def update_answers(
    questionnaire_id: UUID,
    update: AnswersUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Questionnaire).where(
            and_(
                Questionnaire.id == questionnaire_id,
                Questionnaire.company_id == current_user.company_id
            )
        )
    )
    questionnaire = result.scalar_one_or_none()
    
    if not questionnaire:
        return error_response("NOT_FOUND", "Questionnaire not found")
    
    # Merge answers
    if not questionnaire.answers:
        questionnaire.answers = {}
    questionnaire.answers.update(update.answers)
    
    await db.commit()
    await db.refresh(questionnaire)
    
    response = QuestionnaireResponse.from_orm(questionnaire)
    return success_response(response.dict())