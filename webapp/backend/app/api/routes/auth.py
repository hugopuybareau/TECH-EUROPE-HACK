from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, UserInfo
from app.schemas.common import success_response, error_response
from app.schemas.user import UserResponse
from app.core.security import verify_password, create_access_token
from app.api.deps import get_current_user


router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login")
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(request.password, user.hashed_password):
        return error_response("AUTH_FAILED", "Invalid email or password")
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "company_id": str(user.company_id),
            "role": user.role.value
        }
    )
    
    response = LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserInfo(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role.value,
            company_id=user.company_id
        )
    )
    
    return success_response(response.dict())


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    user_response = UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role.value,
        company_id=current_user.company_id,
        created_at=current_user.created_at
    )
    return success_response(user_response.dict())