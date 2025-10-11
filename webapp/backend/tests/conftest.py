import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from typing import AsyncGenerator
import uuid
from datetime import datetime

from app.main import app
from app.db.base import Base
from app.models import *
from app.core.security import hash_password
from app.db.session import get_db


# Test database URL - use a separate test database
TEST_DATABASE_URL = "postgresql+asyncpg://localhost/test_onboarding_db"

# Create test engine
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestSessionLocal() as session:
        yield session
    
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with overridden database dependency."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_company(db_session: AsyncSession):
    """Create a test company."""
    company = Company(
        id=uuid.uuid4(),
        name="Test Company",
        domain="test.com",
        created_at=datetime.utcnow()
    )
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)
    return company


@pytest_asyncio.fixture
async def test_admin(db_session: AsyncSession, test_company):
    """Create a test admin user."""
    from app.models.user import User, UserRole
    
    admin = User(
        id=uuid.uuid4(),
        email="admin@test.com",
        hashed_password=hash_password("testpass123"),
        name="Test Admin",
        role=UserRole.ADMIN,
        company_id=test_company.id,
        created_at=datetime.utcnow()
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin


@pytest_asyncio.fixture
async def test_dev(db_session: AsyncSession, test_company):
    """Create a test dev user."""
    from app.models.user import User, UserRole
    
    dev = User(
        id=uuid.uuid4(),
        email="dev@test.com",
        hashed_password=hash_password("devpass123"),
        name="Test Dev",
        role=UserRole.DEV,
        company_id=test_company.id,
        created_at=datetime.utcnow()
    )
    db_session.add(dev)
    await db_session.commit()
    await db_session.refresh(dev)
    return dev


@pytest_asyncio.fixture
async def admin_token(client: AsyncClient, test_admin):
    """Get an admin authentication token."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "testpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    return data["data"]["access_token"]


@pytest_asyncio.fixture
async def dev_token(client: AsyncClient, test_dev):
    """Get a dev authentication token."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "dev@test.com", "password": "devpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    return data["data"]["access_token"]


@pytest_asyncio.fixture
async def test_template_part(db_session: AsyncSession, test_company):
    """Create a test template part."""
    from app.models.template import TemplatePart
    
    part = TemplatePart(
        id=uuid.uuid4(),
        company_id=test_company.id,
        title="Test IDE Setup",
        description="Test description",
        role_key="intern",
        tags=["ide", "test"],
        fields=[
            {
                "id": "f_test",
                "label": "Test Field",
                "type": "text",
                "required": True
            }
        ],
        validators=[]
    )
    db_session.add(part)
    await db_session.commit()
    await db_session.refresh(part)
    return part