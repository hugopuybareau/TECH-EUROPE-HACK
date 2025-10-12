# Developer Onboarding Platform

> **Built for TechEurope Hackathon Berlin 2024**
> Automating developer onboarding with AI-powered repository analysis and intelligent workflow automation.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Sponsor Technologies](#sponsor-technologies)
- [Getting Started](#getting-started)
- [Components](#components)
- [Demo Credentials](#demo-credentials)
- [Team](#team)

---

## Overview

The Developer Onboarding Platform is a comprehensive solution designed to streamline and automate the onboarding process for new developers joining a team. By combining AI-powered repository analysis, intelligent workflow automation, and real-time developer monitoring, we've created a system that reduces onboarding time from days to hours.

### The Problem

Traditional developer onboarding is:
- Time-consuming and manual
- Inconsistent across teams
- Difficult to track and measure
- Prone to missing critical setup steps

### Our Solution

An automated platform that:
1. **Analyzes** your repository structure and dependencies
2. **Generates** customized onboarding templates with validation steps
3. **Tracks** developer progress in real-time via a desktop overlay
4. **Validates** setup completion with automated checks

---

## Key Features

### Admin Web Application
- **Template Management**: Create, edit, and manage onboarding templates
- **Repository Integration**: Connect GitHub repositories for automatic analysis
- **Progress Tracking**: Monitor developer onboarding in real-time
- **AI-Powered Analysis**: Automatic repository scanning and template generation
- **Role-Based Access**: Admin and developer user roles with appropriate permissions

### Developer Desktop Overlay
A separate desktop application that developers install to:
- View onboarding tasks in an overlay window
- Track progress automatically
- Validate environment setup
- Report completion status back to the admin dashboard

**Repository**: [TECH-EUROPE-OVERLAY](https://github.com/maxmaxou2/TECH-EUROPE-OVERLAY)
- **Frontend**: React + TypeScript + Tauri
- **Backend**: Rust (high-performance, cross-platform)

---

## Architecture

### Monorepo Structure

```
.
├── webapp/
│   ├── frontend/          # React + TypeScript + Vite + shadcn/ui
│   └── backend/           # FastAPI + SQLAlchemy + PostgreSQL
├── n8n.json               # Workflow automation configuration
├── CLAUDE.md              # Project documentation for AI assistance
└── Makefile               # Development commands
```

### Tech Stack

#### Frontend (`webapp/frontend/`)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Authentication**: JWT-based auth with localStorage

#### Backend (`webapp/backend/`)
- **Framework**: FastAPI (Python 3.13)
- **ORM**: SQLAlchemy 2.0 (async)
- **Database**: PostgreSQL with asyncpg
- **Migrations**: Alembic
- **Authentication**: JWT + bcrypt
- **Package Manager**: uv (ultra-fast Python package manager)

#### Workflow Automation
- **Platform**: n8n (self-hosted)
- **Integration**: OpenAI API for repository analysis
- **Workflow**: Webhook-triggered repository scanning and template generation

---

## Sponsor Technologies

This project was built using three key sponsor technologies:

### 1. Lovable (formerly GPT Engineer)
Lovable was instrumental in rapidly prototyping and building our frontend interface. The AI-powered development platform helped us:
- Generate React components quickly
- Implement responsive UI designs
- Create consistent styling with Tailwind CSS
- Accelerate the development process during the hackathon

### 2. n8n - Workflow Automation
n8n powers our intelligent repository analysis pipeline:
- **Webhook Integration**: Receives repository scan requests from the admin dashboard
- **Git Operations**: Automatically clones and analyzes repositories
- **AI Processing**: Integrates with OpenAI to generate onboarding templates
- **Error Handling**: Robust retry logic and error reporting
- **Template Generation**: Creates structured onboarding steps with validators

The complete workflow is available in `n8n.json` at the root level and can be imported into any n8n instance.

**Workflow Overview**:
1. Receives webhook trigger with repository URL
2. Clones repository to temporary directory
3. Extracts project structure and dependency information
4. Sends to OpenAI for analysis and summary generation
5. Generates structured onboarding template parts with validation rules
6. Posts results back to the FastAPI backend
7. Error handling and retry logic for failed operations

### 3. OpenAI
OpenAI's GPT models power our intelligent repository analysis:
- **Repository Analysis**: Understands project structure, languages, and frameworks
- **Template Generation**: Creates customized onboarding steps based on repository content
- **Smart Recommendations**: Suggests IDE setup, dependencies, and validation checks
- **Natural Language Processing**: Generates clear, developer-friendly instructions

---

## Getting Started

### Prerequisites
- Python 3.13+
- Node.js 18+
- PostgreSQL
- uv (Python package manager)
- n8n instance (optional, for workflow automation)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd TECH-EUROPE-HACK
```

2. **Install dependencies**
```bash
make install
```
This will:
- Create a Python virtual environment with uv
- Install backend dependencies
- Install frontend dependencies via npm

3. **Database setup**

Create a PostgreSQL database with password `berlinhack`:
```bash
createdb onboarding_platform
```

Configure `webapp/backend/.env`:
```env
DATABASE_URL=postgresql+asyncpg://postgres:berlinhack@localhost:5432/onboarding_platform
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=120
```

4. **Run database migrations**
```bash
cd webapp/backend
alembic -c alembic/alembic.ini upgrade head
```

5. **Seed the database**
```bash
cd webapp/backend
uv run python seed.py
```
This creates demo users and sample data.

6. **Start the application**

Open two terminal windows:

**Terminal 1 - Backend**:
```bash
cd /path/to/TECH-EUROPE-HACK
make backend-up
```
Backend runs on `http://localhost:8000`

**Terminal 2 - Frontend**:
```bash
cd /path/to/TECH-EUROPE-HACK
make frontend-up
```
Frontend runs on `http://localhost:8080`

### n8n Workflow Setup (Optional)

1. Install and run n8n:
```bash
npm install -g n8n
n8n start
```

2. Import the workflow:
   - Open n8n UI (usually `http://localhost:5678`)
   - Go to Workflows → Import from File
   - Select `n8n.json` from the repository root
   - Configure OpenAI credentials in the workflow nodes
   - Activate the workflow

3. Update the webhook URL in your backend configuration to point to your n8n instance.

---

## Components

### Database Models
- **Company**: Organization entity
- **User**: Admin and developer accounts with role-based access
- **Template**: Onboarding template container
- **TemplatePart**: Individual onboarding steps
- **Onboarding**: Tracks developer onboarding progress
- **Repository**: Connected GitHub repositories
- **Questionnaire**: Custom onboarding questionnaires
- **RoleProfile**: Developer role profiles
- **Event**: Activity tracking and audit logs

### API Endpoints

**Authentication** (`/api/v1/auth`)
- `POST /login` - User authentication
- `POST /register` - User registration
- `GET /me` - Get current user

**Templates** (`/api/v1/templates`)
- CRUD operations for onboarding templates
- Template part management
- Template composition

**Onboardings** (`/api/v1/onboardings`)
- Create and track developer onboarding
- Progress updates
- Completion validation

**Repositories** (`/api/v1/repos`)
- Repository integration
- Scan triggering
- Scan result handling

**Admin** (`/api/v1/admin`)
- Company management
- User administration
- System settings

### Developer Overlay Application

The desktop overlay application is a separate project that developers install on their machines:

**Repository**: [TECH-EUROPE-OVERLAY](https://github.com/maxmaxou2/TECH-EUROPE-OVERLAY)

**Features**:
- Lightweight desktop overlay window
- Real-time task synchronization
- Automated validation checks
- Cross-platform support (Windows, macOS, Linux)
- Minimal resource usage

**Tech Stack**:
- **Frontend**: React + TypeScript + Tauri
- **Backend**: Rust for high performance and cross-platform compatibility

**Why separate?**: We created a standalone repository for the overlay to ensure:
- Clean separation of concerns
- Independent release cycles
- Easier developer downloads
- Cross-platform distribution

---

## Demo Credentials

After running the seed script, you can log in with these accounts:

**Admin Account**:
- Email: `admin@acme.io`
- Password: `admin123`
- Access: Full admin dashboard with all features

**Developer Account**:
- Email: `dev@acme.io`
- Password: `dev123`
- Access: Developer view with onboarding tasks

---

## Development Commands

### Backend
```bash
# Run backend server
cd webapp/backend
.venv/bin/uvicorn app.main:app --reload --port 8000

# Create new migration
cd webapp/backend
.venv/bin/alembic revision --autogenerate -m "description"

# Run tests
cd webapp/backend
.venv/bin/pytest
```

### Frontend
```bash
# Run dev server
cd webapp/frontend
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

### Quick Commands (from root)
```bash
make install          # Install all dependencies
make backend-up       # Start backend server
make frontend-up      # Start frontend dev server
```

---

## API Documentation

Once the backend is running, explore the API at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Team

Built with passion during TechEurope Hackathon Berlin 2024.

---

## License

MIT License - Built for TechEurope Hackathon 2024

---

## Acknowledgments

Special thanks to our sponsors:
- **Lovable** for AI-powered frontend development tools
- **n8n** for powerful workflow automation
- **OpenAI** for intelligent repository analysis
- **TechEurope** for organizing this amazing hackathon
