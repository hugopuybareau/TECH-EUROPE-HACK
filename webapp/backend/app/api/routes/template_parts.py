from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from typing import Optional
from uuid import UUID
from app.db.session import get_db
from app.models.template import TemplatePart
from app.models.user import User
from app.schemas.template import TemplatePartCreate, TemplatePartUpdate, TemplatePartResponse
from app.schemas.common import success_response, error_response
from app.api.deps import get_current_user, require_admin


router = APIRouter(prefix="/api/v1/template-parts", tags=["template-parts"])


@router.get("/")
async def get_template_parts(
    role_key: Optional[str] = None,
    tag: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(TemplatePart).where(
        TemplatePart.company_id == current_user.company_id
    )
    
    if role_key:
        query = query.where(TemplatePart.role_key == role_key)
    
    if tag:
        query = query.where(TemplatePart.tags.contains([tag]))
    
    result = await db.execute(query)
    parts = result.scalars().all()
    
    response = [TemplatePartResponse.from_orm(p) for p in parts]
    return success_response([r.dict() for r in response])


@router.post("/")
async def create_template_part(
    part: TemplatePartCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    db_part = TemplatePart(
        company_id=current_user.company_id,
        title=part.title,
        description=part.description,
        role_key=part.role_key,
        tags=part.tags,
        fields=part.fields,
        validators=part.validators
    )
    
    db.add(db_part)
    await db.commit()
    await db.refresh(db_part)
    
    response = TemplatePartResponse.from_orm(db_part)
    return success_response(response.dict())


@router.patch("/{part_id}")
async def update_template_part(
    part_id: UUID,
    update: TemplatePartUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(TemplatePart).where(
            and_(
                TemplatePart.id == part_id,
                TemplatePart.company_id == current_user.company_id
            )
        )
    )
    part = result.scalar_one_or_none()
    
    if not part:
        return error_response("NOT_FOUND", "Template part not found")
    
    update_data = update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(part, field, value)
    
    await db.commit()
    await db.refresh(part)
    
    response = TemplatePartResponse.from_orm(part)
    return success_response(response.dict())


@router.delete("/{part_id}")
async def delete_template_part(
    part_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        delete(TemplatePart).where(
            and_(
                TemplatePart.id == part_id,
                TemplatePart.company_id == current_user.company_id
            )
        )
    )
    
    await db.commit()
    
    if result.rowcount == 0:
        return error_response("NOT_FOUND", "Template part not found")
    
    return success_response({"deleted": True})