import asyncio
import random
from uuid import UUID
from sqlalchemy import update
from app.models.repo import RepoScan, ScanStatus
from app.db.session import AsyncSessionLocal


async def scan_repository(repo_id: UUID, scan_id: UUID, company_id: UUID):
    """Simulate repository scanning with fake data"""
    
    # Sleep to simulate scanning time
    await asyncio.sleep(random.uniform(2, 3))
    
    # Generate fake scan summary
    summary = {
        "dependencies": [
            "python:requests",
            "python:fastapi",
            "node:axios",
            "node:express"
        ],
        "make_targets": ["setup", "test", "build", "deploy"],
        "package_managers": ["pip", "npm", "yarn"],
        "file_count": random.randint(50, 200),
        "language_stats": {
            "Python": f"{random.randint(30, 60)}%",
            "JavaScript": f"{random.randint(20, 40)}%",
            "Other": f"{random.randint(10, 30)}%"
        }
    }
    
    # Update scan status in database
    async with AsyncSessionLocal() as db:
        await db.execute(
            update(RepoScan)
            .where(RepoScan.id == scan_id)
            .values(
                status=ScanStatus.DONE,
                summary=summary
            )
        )
        await db.commit()