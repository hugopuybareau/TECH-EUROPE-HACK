import asyncio
import uuid
from datetime import datetime, timedelta
from sqlalchemy import select, and_, func
from app.db.session import AsyncSessionLocal
from app.models.company import Company
from app.models.user import User, UserRole
from app.models.role_profile import RoleProfile
from app.models.template import TemplatePart, OnboardingTemplate, TemplateStatus
from app.models.questionnaire import Questionnaire, ToolSet
from app.models.repo import Repo, RepoScan, RepoProvider, ScanStatus
from app.models.onboarding import OnboardingState, OnboardingStatus
from app.core.security import hash_password


async def seed_database():
    async with AsyncSessionLocal() as db:
        # Ensure a company exists (create if missing)
        company = (await db.execute(select(Company).limit(1))).scalar_one_or_none()
        if not company:
            company = Company(
                id=uuid.uuid4(),
                name="Acme Corp",
                domain="acme.io",
                created_at=datetime.utcnow(),
            )
            db.add(company)
            await db.commit()
            await db.refresh(company)

        # Ensure admin user exists
        admin_user = (
            await db.execute(select(User).where(and_(User.company_id == company.id, User.role == UserRole.ADMIN)))
        ).scalar_one_or_none()
        created_admin = False
        if not admin_user:
            admin_user = User(
                id=uuid.uuid4(),
                email="admin@acme.io",
                hashed_password=hash_password("admin123"),
                name="Admin User",
                role=UserRole.ADMIN,
                company_id=company.id,
                created_at=datetime.utcnow(),
            )
            db.add(admin_user)
            created_admin = True

        # Create 3 fake developers
        fake_devs = [
            {"email": "alice.smith@acme.io", "name": "Alice Smith", "password": "dev123"},
            {"email": "bob.jones@acme.io", "name": "Bob Jones", "password": "dev123"},
            {"email": "charlie.wilson@acme.io", "name": "Charlie Wilson", "password": "dev123"},
        ]

        created_devs = []
        for fake_dev in fake_devs:
            existing_user = (
                await db.execute(select(User).where(User.email == fake_dev["email"]))
            ).scalar_one_or_none()
            if not existing_user:
                user = User(
                    id=uuid.uuid4(),
                    email=fake_dev["email"],
                    hashed_password=hash_password(fake_dev["password"]),
                    name=fake_dev["name"],
                    role=UserRole.DEV,
                    company_id=company.id,
                    created_at=datetime.utcnow(),
                )
                db.add(user)
                created_devs.append(user)
            else:
                created_devs.append(existing_user)

        # Create Intern Demo user (no onboarding state)
        intern_demo = (
            await db.execute(select(User).where(User.email == "intern.demo@acme.io"))
        ).scalar_one_or_none()
        created_intern_demo = False
        if not intern_demo:
            intern_demo = User(
                id=uuid.uuid4(),
                email="intern.demo@acme.io",
                hashed_password=hash_password("demo123"),
                name="Intern Demo",
                role=UserRole.DEV,
                company_id=company.id,
                created_at=datetime.utcnow(),
            )
            db.add(intern_demo)
            created_intern_demo = True

        # Ensure role profiles
        required_roles = {
            "intern": "Intern",
            "manager": "Engineering Manager",
            "cto": "Chief Technology Officer",
        }
        for key, name in required_roles.items():
            role = (
                await db.execute(
                    select(RoleProfile).where(and_(RoleProfile.company_id == company.id, RoleProfile.key == key))
                )
            ).scalar_one_or_none()
            if not role:
                db.add(RoleProfile(id=uuid.uuid4(), key=key, name=name, company_id=company.id))

        await db.commit()

        # Ensure template parts (only if none exist)
        parts_exist = (await db.execute(select(TemplatePart).where(TemplatePart.company_id == company.id).limit(1))).scalar_one_or_none()
        if not parts_exist:
            parts = [
                TemplatePart(
                    id=uuid.uuid4(),
                    company_id=company.id,
                    title="IDE Setup",
                    description="Install and configure your development environment",
                    role_key="intern",
                    tags=["ide", "setup", "environment"],
                    fields=[
                        {"id": "f_ide", "label": "Preferred IDE", "type": "select", "required": True, "options": ["VSCode", "Cursor", "IntelliJ", "Vim"]},
                    ],
                    validators=[{"type": "command", "params": {"command": "code --version"}, "os": "mac"}],
                ),
                TemplatePart(
                    id=uuid.uuid4(),
                    company_id=company.id,
                    title="CLI Tools",
                    description="Install essential command-line tools",
                    role_key="intern",
                    tags=["cli", "tools", "terminal"],
                    fields=[{"id": "f_shell", "label": "Preferred shell", "type": "select", "required": True, "options": ["bash", "zsh", "fish"]}],
                    validators=[{"type": "command", "params": {"command": "git --version"}}],
                ),
            ]
            for p in parts:
                db.add(p)
            await db.commit()

        # Ensure an onboarding template exists
        template = (
            await db.execute(select(OnboardingTemplate).where(OnboardingTemplate.company_id == company.id).limit(1))
        ).scalar_one_or_none()
        if not template:
            part_ids = [
                r[0]
                for r in (await db.execute(select(TemplatePart.id).where(TemplatePart.company_id == company.id).limit(5))).all()
            ]
            template = OnboardingTemplate(
                id=uuid.uuid4(),
                company_id=company.id,
                name="Intern Onboarding",
                role_key="intern",
                part_ids=part_ids,
                status=TemplateStatus.PUBLISHED,
                version=1,
            )
            db.add(template)
            await db.commit()
            await db.refresh(template)

        # Ensure questionnaire and toolset for the template
        questionnaire = (
            await db.execute(select(Questionnaire).where(and_(Questionnaire.company_id == company.id, Questionnaire.template_id == template.id)))
        ).scalar_one_or_none()
        if not questionnaire:
            questionnaire = Questionnaire(id=uuid.uuid4(), company_id=company.id, template_id=template.id, fields=[], answers={})
            db.add(questionnaire)
            await db.commit()
            await db.refresh(questionnaire)

        toolset = (
            await db.execute(select(ToolSet).where(and_(ToolSet.company_id == company.id, ToolSet.questionnaire_id == questionnaire.id)))
        ).scalar_one_or_none()
        if not toolset:
            toolset = ToolSet(id=uuid.uuid4(), company_id=company.id, questionnaire_id=questionnaire.id, resolved_steps=[])
            db.add(toolset)
            await db.commit()
            await db.refresh(toolset)

        # Create one onboarding state for each fake dev (3 total)
        created_onboardings = 0
        part_ids_all = [r[0] for r in (await db.execute(select(TemplatePart.id).where(TemplatePart.company_id == company.id))).all()]

        for idx, dev in enumerate(created_devs):
            # Check if this user already has an onboarding state
            existing_onboarding = (
                await db.execute(
                    select(OnboardingState).where(
                        and_(
                            OnboardingState.company_id == company.id,
                            OnboardingState.user_id == dev.id
                        )
                    )
                )
            ).scalar_one_or_none()

            if not existing_onboarding:
                # Create varied onboarding states for each dev
                if idx == 0:
                    # Alice: mostly completed
                    steps = [
                        {"id": f"step-1-{idx}", "title": "IDE Setup", "status": "completed"},
                        {"id": f"step-2-{idx}", "title": "CLI Tools", "status": "completed"},
                        {"id": f"step-3-{idx}", "title": "Final Setup", "status": "in_progress"},
                    ]
                    progress = 66
                    status = OnboardingStatus.ACTIVE
                elif idx == 1:
                    # Bob: just started
                    steps = [
                        {"id": f"step-1-{idx}", "title": "IDE Setup", "status": "in_progress"},
                        {"id": f"step-2-{idx}", "title": "CLI Tools", "status": "not_started"},
                        {"id": f"step-3-{idx}", "title": "Final Setup", "status": "not_started"},
                    ]
                    progress = 0
                    status = OnboardingStatus.ACTIVE
                else:
                    # Charlie: halfway through
                    steps = [
                        {"id": f"step-1-{idx}", "title": "IDE Setup", "status": "completed"},
                        {"id": f"step-2-{idx}", "title": "CLI Tools", "status": "in_progress"},
                        {"id": f"step-3-{idx}", "title": "Final Setup", "status": "not_started"},
                    ]
                    progress = 33
                    status = OnboardingStatus.ACTIVE

                onboarding = OnboardingState(
                    id=uuid.uuid4(),
                    company_id=company.id,
                    user_id=dev.id,
                    template_id=template.id,
                    toolset_id=toolset.id,
                    status=status,
                    progress=progress,
                    steps=steps,
                )
                db.add(onboarding)
                created_onboardings += 1

        # Ensure at least one repository
        repo = (
            await db.execute(select(Repo).where(Repo.company_id == company.id).limit(1))
        ).scalar_one_or_none()
        created_repo = False
        if not repo:
            repo = Repo(
                id=uuid.uuid4(),
                company_id=company.id,
                provider=RepoProvider.GITHUB,
                org="company",
                name="main-app",
                default_branch="main",
                created_at=datetime.utcnow(),
            )
            db.add(repo)
            await db.commit()
            await db.refresh(repo)
            created_repo = True
        # If fewer than 3 repos, create more
        repo_count = (
            await db.execute(select(func.count(Repo.id)).where(Repo.company_id == company.id))
        ).scalar_one()
        if repo_count < 3:
            existing = (
                await db.execute(select(Repo).where(Repo.company_id == company.id))
            ).scalars().all()
            existing_names = {(r.org, r.name) for r in existing}
            candidates = [("company", "main-api"), ("company", "infra-scripts")]
            for org, name in candidates:
                if repo_count >= 3:
                    break
                if (org, name) in existing_names:
                    continue
                db.add(
                    Repo(
                        id=uuid.uuid4(),
                        company_id=company.id,
                        provider=RepoProvider.GITHUB,
                        org=org,
                        name=name,
                        default_branch="main",
                        created_at=datetime.utcnow(),
                    )
                )
                repo_count += 1
            await db.commit()

        # Ensure multiple recent scans (at least 3) with varied statuses
        created_scan = False
        scans_count = (
            await db.execute(select(func.count(RepoScan.id)).where(RepoScan.company_id == company.id))
        ).scalar_one()
        # Fetch repos list for assignment
        repos_list = (
            await db.execute(select(Repo).where(Repo.company_id == company.id))
        ).scalars().all()
        if scans_count == 0 and repos_list:
            t1 = datetime.utcnow() - timedelta(minutes=5)
            s1 = RepoScan(
                id=uuid.uuid4(),
                company_id=company.id,
                repo_id=repos_list[0].id,
                status=ScanStatus.DONE,
                summary={"markdown": "# Initial scan\n- Dependencies found\n- Targets detected"},
            )
            s1.created_at = t1
            s1.updated_at = t1 + timedelta(minutes=2)
            db.add(s1)
            created_scan = True
            scans_count += 1
        if scans_count < 2 and len(repos_list) > 1:
            t2 = datetime.utcnow() - timedelta(minutes=3)
            s2 = RepoScan(
                id=uuid.uuid4(),
                company_id=company.id,
                repo_id=repos_list[1].id,
                status=ScanStatus.DONE,
                summary={"markdown": "# Scan\n- OK"},
            )
            s2.created_at = t2
            s2.updated_at = t2
            db.add(s2)
            created_scan = True
            scans_count += 1
        if scans_count < 3 and repos_list:
            t3 = datetime.utcnow() - timedelta(minutes=1)
            target_repo = repos_list[2] if len(repos_list) > 2 else repos_list[0]
            s3 = RepoScan(
                id=uuid.uuid4(),
                company_id=company.id,
                repo_id=target_repo.id,
                status=ScanStatus.RUNNING,
                summary={"markdown": "# Scan\n- In progress"},
            )
            s3.created_at = t3
            s3.updated_at = datetime.utcnow()
            db.add(s3)
            created_scan = True

        await db.commit()

        print("✅ Seed ensured baseline dashboard data.")
        print("- Company:", company.name)
        print("- Admin user:", "created" if created_admin else "existing")
        print(f"- Fake devs: {len(created_devs)} users")
        print("- Intern Demo user:", "created" if created_intern_demo else "existing (no onboarding)")
        print(f"- Onboardings: {created_onboardings} created")
        print("- Repo:", f"{repo.org}/{repo.name}")
        print("- Scan:", "created" if created_scan else "existing")


if __name__ == "__main__":
    asyncio.run(seed_database())
