from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.building import Building, BuildingRead, Zone, ZoneRead
from app.schemas.analytics import BuildingKPISummary, EnergyCurveResponse, ZoneEnergySummary
from app.services.energy_service import (
    get_building_kpi_summary,
    get_energy_curve,
    get_zones_summary,
)

router = APIRouter(prefix="/buildings", tags=["Edificios & Analítica"])


@router.get("", response_model=List[BuildingRead], summary="Listar edificios gestionados")
def list_buildings(session: Session = Depends(get_session)):
    """Obtiene el listado completo de edificios corporativos registrados."""
    return session.exec(select(Building)).all()


@router.get("/{building_id}", response_model=BuildingRead, summary="Detalle de un edificio")
def get_building(building_id: int, session: Session = Depends(get_session)):
    """Obtiene los datos maestros de un edificio por ID."""
    building = session.get(Building, building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Edificio no encontrado")
    return building


@router.get("/{building_id}/summary", response_model=BuildingKPISummary, summary="Resumen KPIs en tiempo real")
def get_summary(building_id: int, session: Session = Depends(get_session)):
    """Calcula los indicadores clave de energía, potencia, costes y estado operativo."""
    try:
        return get_building_kpi_summary(session, building_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{building_id}/energy-curve", response_model=EnergyCurveResponse, summary="Curva de carga energética")
def get_curve(
    building_id: int,
    hours_back: int = Query(default=24, ge=1, le=168, description="Número de horas hacia atrás a consultar"),
    session: Session = Depends(get_session)
):
    """Devuelve los puntos temporales horarios de potencia y consumo desglosados por zonas."""
    return get_energy_curve(session, building_id, hours_back=hours_back)


@router.get("/{building_id}/zones", response_model=List[ZoneEnergySummary], summary="Desglose energético por zonas")
def get_zones(building_id: int, session: Session = Depends(get_session)):
    """Devuelve las áreas funcionales de un edificio con su consumo y potencia actual."""
    return get_zones_summary(session, building_id)
