import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Resolve parent directory in search path to import config module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config as backend_config

from .database import engine, Base
from .seed import seed_database
from .routers import auth, employees, attendance, advances, cycles, reports, audit, paddy

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Auto-seed database if empty for demo/testing
if backend_config.MODE == "dev":
    seed_database()

app = FastAPI(
    title="Payroll Management API",
    version="3.0",
    description="Decoupled backend engine for attendance tracking and payroll calculations."
)

# CORS Setup - Requirement 4.4.1
origins = [origin.strip() for origin in backend_config.CORS_ORIGINS.split(",") if origin.strip()]

# Allow overriding/appending via environment variables
allowed_origins_env = backend_config.ALLOWED_ORIGINS
if allowed_origins_env:
    for origin in allowed_origins_env.split(","):
        origins.append(origin.strip())


# Support wildcard override if specified
if "*" in origins or backend_config.ALLOW_ALL_CORS == "true":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include routers
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(advances.router)
app.include_router(cycles.router)
app.include_router(reports.router)
app.include_router(audit.router)
app.include_router(paddy.router)
