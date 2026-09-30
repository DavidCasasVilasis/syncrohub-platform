from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.maintenance import (
    MaintenanceTicket,
    MaintenanceTicketRead,
    MaintenanceTicketCreate,
    MaintenanceTicketUpdate,
)

router = APIRouter(prefix="/maintenance", tags=["Mantenimiento & Incidencias"])


@router.get("/tickets", response_model=List[MaintenanceTicketRead], summary="Listar tickets de mantenimiento")
def list_tickets(
    building_id: Optional[int] = Query(default=None, description="Filtrar por edificio"),
    status: Optional[str] = Query(default=None, description="Filtrar por estado: OPEN, IN_PROGRESS, COMPLETED"),
    session: Session = Depends(get_session)
):
    """Devuelve las órdenes de trabajo y solicitudes de mantenimiento."""
    query = select(MaintenanceTicket).order_by(MaintenanceTicket.created_at.desc())
    if building_id:
        query = query.where(MaintenanceTicket.building_id == building_id)
    if status:
        query = query.where(MaintenanceTicket.status == status)
    return session.exec(query).all()


@router.post("/tickets", response_model=MaintenanceTicketRead, summary="Crear ticket de mantenimiento")
def create_ticket(
    payload: MaintenanceTicketCreate,
    session: Session = Depends(get_session)
):
    """Registra una nueva incidencia técnica manual o derivada de una alerta IoT."""
    ticket = MaintenanceTicket(
        building_id=payload.building_id,
        alert_id=payload.alert_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status="OPEN",
        assigned_to=payload.assigned_to or "Equipo de Mantenimiento General",
        created_at=datetime.now(timezone.utc)
    )
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return ticket


@router.patch("/tickets/{ticket_id}", response_model=MaintenanceTicketRead, summary="Actualizar estado del ticket")
def update_ticket(
    ticket_id: int,
    payload: MaintenanceTicketUpdate,
    session: Session = Depends(get_session)
):
    """Actualiza el progreso, asignación o cierre de un ticket de mantenimiento."""
    ticket = session.get(MaintenanceTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    if payload.status:
        ticket.status = payload.status
        if payload.status == "COMPLETED":
            ticket.resolved_at = datetime.now(timezone.utc)
    if payload.priority:
        ticket.priority = payload.priority
    if payload.assigned_to:
        ticket.assigned_to = payload.assigned_to

    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    return ticket
