from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.meter import Meter
from app.models.reading import Reading, ReadingRead
from app.schemas.telemetry import ReadingCreate, BatchReadingCreate, IngestionResponse
from app.services.anomaly_service import evaluate_reading_anomalies

router = APIRouter(prefix="/telemetry", tags=["Telemetría IoT & Ingesta"])


@router.post("/readings", response_model=IngestionResponse, summary="Ingesta de telemetría IoT")
def ingest_readings(
    payload: BatchReadingCreate,
    session: Session = Depends(get_session)
):
    """
    Punto de entrada de alta eficiencia para que concentradores o gateways IoT envíen lecturas.
    Valida los datos, actualiza el estado de vida del contador y evalúa anomalías en tiempo real.
    """
    inserted = 0
    alerts_triggered = 0

    for item in payload.readings:
        meter = session.get(Meter, item.meter_id)
        if not meter:
            continue

        reading = Reading(
            meter_id=item.meter_id,
            timestamp=item.timestamp,
            active_energy_kwh=item.active_energy_kwh,
            instant_power_kw=item.instant_power_kw,
            reactive_energy_kvarh=item.reactive_energy_kvarh,
            voltage_v=item.voltage_v,
            current_a=item.current_a,
        )
        session.add(reading)
        
        # Actualizar heartbeat del dispositivo
        meter.last_seen_at = item.timestamp
        meter.status = "ONLINE"
        session.add(meter)

        # Evaluar anomalías
        alerts = evaluate_reading_anomalies(session, reading, meter)
        alerts_triggered += len(alerts)
        inserted += 1

    session.commit()

    return IngestionResponse(
        inserted_count=inserted,
        alerts_triggered_count=alerts_triggered,
        message=f"Se procesaron con éxito {inserted} lecturas IoT. Anomalías detectadas: {alerts_triggered}."
    )


@router.get("/readings", response_model=List[ReadingRead], summary="Consultar lecturas históricas")
def list_readings(
    meter_id: Optional[int] = Query(default=None, description="Filtrar por ID de contador"),
    limit: int = Query(default=50, ge=1, le=500, description="Límite de registros a devolver"),
    session: Session = Depends(get_session)
):
    """Devuelve las últimas lecturas registradas por orden temporal descendente."""
    query = select(Reading).order_by(Reading.timestamp.desc()).limit(limit)
    if meter_id:
        query = query.where(Reading.meter_id == meter_id)
    return session.exec(query).all()
