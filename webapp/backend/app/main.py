from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from webapp.backend.app.api.routes import (
    auth, companies, template_parts, templates,
    questionnaires, toolsets, onboardings, repos, events
)

# Create FastAPI app
app = FastAPI(
    title="Onboarding API",
    description="Admin app for developer onboarding configuration and tracking",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS - open for hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(template_parts.router)
app.include_router(templates.router)
app.include_router(questionnaires.router)
app.include_router(toolsets.router)
app.include_router(onboardings.router)
app.include_router(repos.router)
app.include_router(events.router)


@app.get("/")
async def root():
    return {
        "message": "Onboarding API",
        "docs": "/docs",
        "version": "0.1.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}