from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import uuid
from app.db.session import get_db
from app.models.questionnaire import Questionnaire, ToolSet
from app.models.user import User
from app.schemas.questionnaire import ToolSetCreate, ToolSetResponse
from app.schemas.common import success_response, error_response
from app.api.deps import get_current_user


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
    
    # Generate resolved steps based on questionnaire answers
    # This is simplified - in production, you'd have more complex logic
    resolved_steps = []
    
    # Add some example steps based on answers
    ide_choice = questionnaire.answers.get("f_ide", "VSCode")
    
    resolved_steps.append({
        "id": str(uuid.uuid4()),
        "title": f"Install {ide_choice}",
        "instructions": f"Download and install {ide_choice} from the official website",
        "commands": [f"brew install --cask {'visual-studio-code' if ide_choice == 'VSCode' else 'cursor'}"],
        "validator": {
            "type": "command",
            "params": {"command": f"{'code' if ide_choice == 'VSCode' else 'cursor'} --version"}
        }
    })
    
    resolved_steps.append({
        "id": str(uuid.uuid4()),
        "title": "Clone repository",
        "instructions": "Clone the main repository to your local machine",
        "commands": ["git clone git@github.com:acme/main.git"],
        "validator": None
    })
    
    resolved_steps.append({
        "id": str(uuid.uuid4()),
        "title": "Install dependencies",
        "instructions": "Install project dependencies",
        "commands": ["cd main", "make setup"],
        "validator": {
            "type": "command",
            "params": {"command": "make test"}
        }
    })
    
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