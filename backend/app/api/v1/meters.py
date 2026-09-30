from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.meter import Meter, MeterRead
from app.models.building import Zone

router = APIRouter(prefix="/meters", tags=["Contadores & Dispositivos IoT"])


@router.get("", response_model=List[MeterRead], summary="Listar contadores IoT")
def list_meters(
    zone_id: Optional[int] = Query(default=None, description="Filtrar por zona"),
    status: Optional[str] = Query(default=None, description="Filtrar por estado"),
    session: Session = Depends(get_session)
):
    """Devuelve los contadores y analizadores de red instalados."""
    query = select(Meter)
    if zone_id:
        query = query.where(Meter.zone_id == zone_id)
    if status:
        query = query.where(Meter.status == status)
    return session.exec(query).all()


@router.get("/{meter_id}", response_model=MeterRead, summary="Detalle de un contador")
def get_meter(meter_id: int, session: Session = Depends(get_session)):
    """Obtiene la configuración y estado de salud de un contador IoT."""
    meter = session.get(Meter, meter_id)
    if not meter:
        raise HTTPException(status_code=404, detail="Contador no encontrado")
    return meter
