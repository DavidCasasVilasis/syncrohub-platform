from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="Healthcheck del sistema", tags=["Sistema"])
def health_check():
    """Verifica que el servicio esté online y listo para recibir tráfico."""
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }
