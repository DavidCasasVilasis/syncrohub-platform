from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from app.core.config import settings
from app.core.database import engine, init_db
from app.services.seed_service import seed_database

# Routers
from app.api.v1.health import router as health_router
from app.api.v1.buildings import router as buildings_router
from app.api.v1.meters import router as meters_router
from app.api.v1.telemetry import router as telemetry_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.maintenance import router as maintenance_router
from app.api.v1.billing import router as billing_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación: inicialización de BD y carga de datos semilla."""
    init_db()
    with Session(engine) as session:
        seed_database(session)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
Plataforma IoT y BMS de Gestión Inteligente de Edificios y Monitorización Energética.
Diseñada para centralizar telemetría de contadores, detección de anomalías, mantenimiento preventivo y facturación.
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuración de CORS universal (admite cualquier dominio de Vercel, Render o localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers v1
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(buildings_router, prefix=settings.API_V1_STR)
app.include_router(meters_router, prefix=settings.API_V1_STR)
app.include_router(telemetry_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix=settings.API_V1_STR)
app.include_router(maintenance_router, prefix=settings.API_V1_STR)
app.include_router(billing_router, prefix=settings.API_V1_STR)


@app.get("/", include_in_schema=False)
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
    }
