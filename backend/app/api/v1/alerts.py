from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.alert import Alert, AlertRead
from app.models.meter import Meter

router = APIRouter(prefix="/alerts", tags=["Alertas & Anomalías"])


@router.get("", response_model=List[AlertRead], summary="Listar alertas del sistema")
def list_alerts(
    building_id: Optional[int] = Query(default=None, description="Filtrar por edificio"),
    status: Optional[str] = Query(default=None, description="Filtrar por estado: ACTIVE, ACKNOWLEDGED, RESOLVED"),
    session: Session = Depends(get_session)
):
    """Devuelve las alertas generadas por el motor de detección de anomalías."""
    query = select(Alert).order_by(Alert.created_at.desc())
    if building_id:
        query = query.where(Alert.building_id == building_id)
    if status:
        query = query.where(Alert.status == status)

    alerts = session.exec(query).all()
    results: List[AlertRead] = []
    for a in alerts:
        meter = session.get(Meter, a.meter_id)
        results.append(
            AlertRead(
                id=a.id or 0,
                building_id=a.building_id,
                meter_id=a.meter_id,
                severity=a.severity,
                title=a.title,
                description=a.description,
                trigger_value=a.trigger_value,
                threshold_value=a.threshold_value,
                status=a.status,
                created_at=a.created_at,
                resolved_at=a.resolved_at,
                meter_name=meter.name if meter else "Desconocido",
            )
        )
    return results


@router.post("/{alert_id}/acknowledge", response_model=AlertRead, summary="Reconocer alerta")
def acknowledge_alert(alert_id: int, session: Session = Depends(get_session)):
    """Marca la alerta como reconocida por el operador de mantenimiento."""
    alert = session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alert.status = "ACKNOWLEDGED"
    session.add(alert)
    session.commit()
    session.refresh(alert)
    meter = session.get(Meter, alert.meter_id)
    return AlertRead(
        id=alert.id or 0,
        building_id=alert.building_id,
        meter_id=alert.meter_id,
        severity=alert.severity,
        title=alert.title,
        description=alert.description,
        trigger_value=alert.trigger_value,
        threshold_value=alert.threshold_value,
        status=alert.status,
        created_at=alert.created_at,
        resolved_at=alert.resolved_at,
        meter_name=meter.name if meter else None,
    )


@router.post("/{alert_id}/resolve", response_model=AlertRead, summary="Resolver alerta")
def resolve_alert(alert_id: int, session: Session = Depends(get_session)):
    """Marca la alerta como resuelta."""
    alert = session.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alert.status = "RESOLVED"
    alert.resolved_at = datetime.now(timezone.utc)
    session.add(alert)
    session.commit()
    session.refresh(alert)
    meter = session.get(Meter, alert.meter_id)
    return AlertRead(
        id=alert.id or 0,
        building_id=alert.building_id,
        meter_id=alert.meter_id,
        severity=alert.severity,
        title=alert.title,
        description=alert.description,
        trigger_value=alert.trigger_value,
        threshold_value=alert.threshold_value,
        status=alert.status,
        created_at=alert.created_at,
        resolved_at=alert.resolved_at,
        meter_name=meter.name if meter else None,
    )
