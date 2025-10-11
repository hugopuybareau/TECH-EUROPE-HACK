import asyncio
import uuid
from datetime import datetime
from app.db.session import AsyncSessionLocal
from app.models.company import Company
from app.models.user import User, UserRole
from app.models.role_profile import RoleProfile
from app.models.template import TemplatePart
from app.core.security import hash_password


async def seed_database():
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select
        result = await db.execute(select(Company).limit(1))
        if result.scalar_one_or_none():
            print("Database already seeded!")
            return
        
        # Create company
        company = Company(
            id=uuid.uuid4(),
            name="Acme Corp",
            domain="acme.io",
            created_at=datetime.utcnow()
        )
        db.add(company)
        
        # Create admin user
        admin_user = User(
            id=uuid.uuid4(),
            email="admin@acme.io",
            hashed_password=hash_password("admin123"),
            name="Admin User",
            role=UserRole.ADMIN,
            company_id=company.id,
            created_at=datetime.utcnow()
        )
        db.add(admin_user)
        
        # Create dev user
        dev_user = User(
            id=uuid.uuid4(),
            email="dev@acme.io",
            hashed_password=hash_password("dev123"),
            name="Dev User",
            role=UserRole.DEV,
            company_id=company.id,
            created_at=datetime.utcnow()
        )
        db.add(dev_user)
        
        # Create role profiles
        roles = [
            RoleProfile(
                id=uuid.uuid4(),
                key="intern",
                name="Intern",
                company_id=company.id
            ),
            RoleProfile(
                id=uuid.uuid4(),
                key="manager",
                name="Engineering Manager",
                company_id=company.id
            ),
            RoleProfile(
                id=uuid.uuid4(),
                key="cto",
                name="Chief Technology Officer",
                company_id=company.id
            )
        ]
        for role in roles:
            db.add(role)
        
        # Create template parts
        template_parts = [
            TemplatePart(
                id=uuid.uuid4(),
                company_id=company.id,
                title="IDE Setup",
                description="Install and configure your development environment",
                role_key="intern",
                tags=["ide", "setup", "environment"],
                fields=[
                    {
                        "id": "f_ide",
                        "label": "Preferred IDE",
                        "type": "select",
                        "required": True,
                        "options": ["VSCode", "Cursor", "IntelliJ", "Vim"]
                    },
                    {
                        "id": "f_theme",
                        "label": "Theme preference",
                        "type": "select",
                        "required": False,
                        "options": ["Dark", "Light", "Auto"]
                    }
                ],
                validators=[
                    {
                        "type": "command",
                        "params": {"command": "code --version"},
                        "os": "mac"
                    }
                ]
            ),
            TemplatePart(
                id=uuid.uuid4(),
                company_id=company.id,
                title="CLI Tools",
                description="Install essential command-line tools",
                role_key="intern",
                tags=["cli", "tools", "terminal"],
                fields=[
                    {
                        "id": "f_shell",
                        "label": "Preferred shell",
                        "type": "select",
                        "required": True,
                        "options": ["bash", "zsh", "fish"]
                    }
                ],
                validators=[
                    {
                        "type": "command",
                        "params": {"command": "git --version"}
                    },
                    {
                        "type": "command",
                        "params": {"command": "docker --version"}
                    }
                ]
            ),
            TemplatePart(
                id=uuid.uuid4(),
                company_id=company.id,
                title="Repository Access",
                description="Clone and set up main repositories",
                role_key="intern",
                tags=["git", "repository", "source"],
                fields=[
                    {
                        "id": "f_github_user",
                        "label": "GitHub username",
                        "type": "text",
                        "required": True
                    },
                    {
                        "id": "f_ssh_key",
                        "label": "SSH key configured",
                        "type": "select",
                        "required": True,
                        "options": ["Yes", "No - need help"]
                    }
                ],
                validators=[
                    {
                        "type": "command",
                        "params": {"command": "ssh -T git@github.com"}
                    },
                    {
                        "type": "file",
                        "params": {"path": "~/.ssh/config"}
                    }
                ]
            ),
            TemplatePart(
                id=uuid.uuid4(),
                company_id=company.id,
                title="Secrets Management",
                description="Set up environment variables and secrets",
                role_key="intern",
                tags=["security", "secrets", "env"],
                fields=[
                    {
                        "id": "f_vault_access",
                        "label": "Vault access requested",
                        "type": "select",
                        "required": True,
                        "options": ["Yes", "No", "Pending"]
                    },
                    {
                        "id": "f_env_file",
                        "label": "ENV file location",
                        "type": "text",
                        "required": False
                    }
                ],
                validators=[
                    {
                        "type": "file",
                        "params": {"path": "~/.env.local"}
                    }
                ]
            ),
            TemplatePart(
                id=uuid.uuid4(),
                company_id=company.id,
                title="Jira & Communication",
                description="Set up project management and communication tools",
                role_key="intern",
                tags=["jira", "slack", "communication"],
                fields=[
                    {
                        "id": "f_jira_user",
                        "label": "Jira username",
                        "type": "text",
                        "required": True
                    },
                    {
                        "id": "f_slack_handle",
                        "label": "Slack handle",
                        "type": "text",
                        "required": True
                    },
                    {
                        "id": "f_team_channel",
                        "label": "Team channel joined",
                        "type": "select",
                        "required": True,
                        "options": ["Yes", "No"]
                    }
                ],
                validators=[
                    {
                        "type": "http",
                        "params": {"url": "https://acme.atlassian.net", "expected_status": 200}
                    }
                ]
            )
        ]
        
        for part in template_parts:
            db.add(part)
        
        await db.commit()
        
        print("✅ Database seeded successfully!")
        print("\nCreated:")
        print(f"  - Company: {company.name} ({company.domain})")
        print("  - Admin user: admin@acme.io / password: admin123")
        print("  - Dev user: dev@acme.io / password: dev123")
        print(f"  - {len(roles)} role profiles")
        print(f"  - {len(template_parts)} template parts")


if __name__ == "__main__":
    asyncio.run(seed_database())