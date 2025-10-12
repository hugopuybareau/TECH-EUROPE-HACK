from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyResponse, CompanyUpdate
from app.schemas.common import success_response, error_response
from app.api.deps import get_current_user


router = APIRouter(prefix="/api/v1/companies", tags=["companies"])


@router.get("/current")
async def get_current_company(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
    )
    company = result.scalar_one_or_none()
    
    if company:
        response = CompanyResponse.from_orm(company)
        return success_response(response.dict())
    
    return success_response(None)


@router.patch("/current")
async def update_current_company(
    payload: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
    )
    company = result.scalar_one_or_none()
    if not company:
        return error_response("NOT_FOUND", "Company not found")

    if payload.name is not None:
        company.name = payload.name
    if payload.domain is not None:
        company.domain = payload.domain
    if payload.default_role is not None:
        company.default_role = payload.default_role

    await db.commit()
    await db.refresh(company)

    response = CompanyResponse.from_orm(company)
    return success_response(response.dict())
