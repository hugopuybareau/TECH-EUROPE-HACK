# Repository Guidelines

## Project Structure & Module Organization
- `webapp/backend`: FastAPI service with async SQLAlchemy.
  - `app/api/routes`: API routers (auth, companies, templates, etc.).
  - `app/core`: config and security helpers.
  - `app/db`: base and async session.
  - `app/models`, `app/schemas`, `app/services`: models, Pydantic DTOs, background stubs.
  - `tests`: pytest setup and fixtures.
- `webapp/frontend`: Vite + React + TypeScript UI (`src/pages`, `src/components`, `src/lib`, `public`).

## Build, Test, and Development Commands
- Backend (uv venv, Python 3.11+):
  - Create and activate: `cd webapp/backend && uv venv && source .venv/bin/activate`
  - Install deps from `pyproject.toml`: `uv pip install -e .`
  - Run API (dev): `uvicorn app.main:app --reload --port 8000`
  - Migrations (if configured): `alembic upgrade head`
  - Seed demo data: `python seed.py`
  - Tests: `pytest -q` (requires local Postgres; see Testing)
- Frontend:
  - `cd webapp/frontend && npm install`
  - Dev server: `npm run dev`
  - Build/preview: `npm run build && npm run preview`

## Coding Style & Naming Conventions
- Python: PEP 8, 4 spaces, type hints. `snake_case` functions/modules, `CapWords` classes. Place new endpoints in `app/api/routes/*.py`; schemas in `app/schemas`; services in `app/services`.
- TypeScript/React: PascalCase components, pages in `src/pages`. Run `npm run lint` before PRs. Prefer functional components, hooks, and Tailwind.

## Testing Guidelines
- Frameworks: `pytest`, `pytest-asyncio`, `httpx`.
- Location: `webapp/backend/tests`. Name files `test_*.py` and reuse fixtures (`client`, `db_session`).
- DB: tests expect `postgresql+asyncpg://localhost/test_onboarding_db`. Ensure Postgres is running and the DB exists.

## Commit & Pull Request Guidelines
- Commits: use concise prefixes as in history (`start:`, `refactor:`, `core:`). Example: `refactor: extract repo scan service`.
- PRs: include purpose, linked issue, testing steps, screenshots for UI, and rollback notes. Keep diffs focused; update docs for API changes.

## Architecture Overview (Backend Prompt)
- FastAPI + uvicorn; async SQLAlchemy 2.x with Postgres and Alembic. JWT (HS256) access token only, 2h expiry; bcrypt passwords. Tenancy via `company_id` on all entities. Open CORS for hackathon; OpenAPI at `/docs`.
- Responses are `{ ok, data }` or `{ ok, error }`. BackgroundTasks used for repo scans. Seed script creates Acme + admin/dev, roles, and template parts.
- Core endpoints: auth/login and `/me`; template-parts CRUD; templates (create/publish/get); questionnaires, toolsets; onboarding state + step start/complete/validate; repos + scans; events/analytics.

## Security & Configuration Tips
- Backend env (`webapp/backend/.env`): `DATABASE_URL`, `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRATION_MINUTES`. Never commit secrets. CORS is wide open for dev; restrict for production.
