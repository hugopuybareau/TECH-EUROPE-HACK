from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from uuid import UUID
from app.db.session import get_db
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventResponse
from app.schemas.common import success_response
from app.api.deps import get_current_user


router = APIRouter(prefix="/api/v1", tags=["events", "analytics"])


@router.get("/events")
async def get_events(
    entity: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Event).where(Event.company_id == current_user.company_id)
    
    if entity:
        query = query.where(Event.entity == entity)
    
    if entity_id:
        query = query.where(Event.entity_id == entity_id)
    
    query = query.order_by(Event.created_at.desc()).limit(100)
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    response = [EventResponse.from_orm(e) for e in events]
    return success_response([r.dict() for r in response])


@router.get("/analytics/onboarding-time")
async def get_onboarding_analytics(
    by: Optional[str] = "role",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Mock analytics data for demo
    analytics = {
        "by": by,
        "data": {
            "intern": {
                "avg_completion_time_hours": 4.5,
                "completion_rate": 0.92,
                "total_onboarded": 45
            },
            "manager": {
                "avg_completion_time_hours": 3.2,
                "completion_rate": 0.95,
                "total_onboarded": 12
            },
            "cto": {
                "avg_completion_time_hours": 2.1,
                "completion_rate": 0.98,
                "total_onboarded": 3
            }
        },
        "period": "last_30_days"
    }
    
    return success_response(analytics)