# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a developer onboarding admin application built as a monorepo with a React frontend and FastAPI backend. The application manages onboarding templates, questionnaires, and tracks developer onboarding progress.

## Architecture

### Frontend (`webapp/frontend/`)
- **Stack**: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: React Router v6 with protected routes
- **Authentication**: JWT-based auth stored in localStorage, managed via AuthContext
- **API Client**: Centralized API wrapper in `src/lib/api.ts` with automatic token injection
- **Key Pages**:
  - Dashboard: Overview and analytics
  - Templates/TemplateParts/TemplateComposer: Manage onboarding templates and components
  - Onboardings: Track developer onboarding progress
  - Repositories/Integrations: Manage repos and toolset integrations
  - Access/Settings: User and system configuration

### Backend (`webapp/backend/`)
- **Stack**: FastAPI + SQLAlchemy (async) + PostgreSQL + Alembic
- **Database**: PostgreSQL with async driver (asyncpg)
- **Authentication**: JWT tokens with bcrypt password hashing
- **ORM**: SQLAlchemy 2.0 async patterns
- **API Structure**:
  - `app/api/routes/`: All route handlers (auth, companies, templates, onboardings, etc.)
  - `app/models/`: SQLAlchemy models (company, user, template, onboarding, repo, etc.)
  - `app/schemas/`: Pydantic schemas for request/response validation
  - `app/services/`: Business logic layer
  - `app/core/`: Configuration and security utilities
  - `app/db/`: Database session management

### Database Models
Core entities: Company, User (with roles: ADMIN/DEV), TemplatePart, Template, Onboarding, Repo, Questionnaire, RoleProfile, Event

## Development Commands

### First-time Setup
```bash
make install
# Installs backend deps with Python 3.13 venv via uv
# Installs frontend deps via npm
```

### Running the Application
```bash
# Terminal 1 - Backend (runs on port 8000)
make backend-up

# Terminal 2 - Frontend (runs on port 8080)
make frontend-up
```

### Backend Development
```bash
# Run backend server
cd webapp/backend
.venv/bin/uvicorn app.main:app --reload --port 8000

# Run database migrations
cd webapp/backend
.venv/bin/alembic upgrade head

# Create new migration
cd webapp/backend
.venv/bin/alembic revision --autogenerate -m "description"

# Seed database with test data
cd webapp/backend
.venv/bin/python seed.py
# Creates: admin@acme.io (password: admin123) and dev@acme.io (password: dev123)

# Run tests
cd webapp/backend
.venv/bin/pytest
```

### Frontend Development
```bash
# Run dev server
cd webapp/frontend
npm run dev

# Build for production
npm run build

# Build for development (with source maps)
npm run build:dev

# Lint
npm run lint

# Preview production build
npm run preview
```

## Key Patterns

### Backend
- **Async/await everywhere**: All database operations use SQLAlchemy async patterns
- **Dependency injection**: Use `Depends(get_db)` for database sessions, `Depends(get_current_user)` for auth
- **CRUD operations**: Business logic in `app/services/`, route handlers delegate to services
- **Authentication**: JWT tokens created in `app/core/security.py`, validated via `app/api/deps.py`
- **CORS**: Wide open for hackathon (`allow_origins=["*"]`), should be restricted for production

### Frontend
- **Protected routes**: All authenticated pages wrapped with `<ProtectedRoute>` component
- **API calls**: Always use the `api` object from `src/lib/api.ts`, never raw fetch
- **Type safety**: TypeScript with relaxed settings (`noImplicitAny: false`, `strictNullChecks: false`)
- **Component library**: Use shadcn/ui components from `@/components/ui/`
- **Path aliases**: Use `@/` prefix for imports from `src/` directory

## Configuration

### Backend Environment Variables
Required in `webapp/backend/.env`:
- `DATABASE_URL`: PostgreSQL connection string (format: `postgresql+asyncpg://user:pass@host:port/db`)
- `JWT_SECRET`: Secret key for JWT token signing
- `JWT_ALGORITHM`: Default is HS256
- `JWT_EXPIRATION_MINUTES`: Default is 120

### Frontend Environment Variables
Optional in `webapp/frontend/.env`:
- `VITE_API_BASE_URL`: Backend API URL (defaults to `http://localhost:8000`)

## Important Notes

- Frontend dev server runs on port 8080, backend on port 8000
- Backend uses Python 3.13 with uv package manager for fast dependency resolution
- Database migrations are in `webapp/backend/alembic/versions/`
- API documentation available at http://localhost:8000/docs (Swagger) and http://localhost:8000/redoc
- Authentication tokens expire after 2 hours by default
- The backend uses a local venv at `webapp/backend/.venv/`
