from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MaintenanceTicketBase(SQLModel):
    building_id: int = Field(foreign_key="buildings.id", index=True)
    alert_id: Optional[int] = Field(default=None, foreign_key="alerts.id", index=True)
    title: str
    description: str
    priority: str = Field(default="MEDIUM", description="LOW, MEDIUM, HIGH, URGENT")
    status: str = Field(default="OPEN", description="OPEN, IN_PROGRESS, COMPLETED")
    assigned_to: Optional[str] = Field(default="Equipo de Mantenimiento General")


class MaintenanceTicket(MaintenanceTicketBase, table=True):
    __tablename__ = "maintenance_tickets"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=get_utc_now)
    resolved_at: Optional[datetime] = Field(default=None)


class MaintenanceTicketRead(MaintenanceTicketBase):
    id: int
    created_at: datetime
    resolved_at: Optional[datetime] = None


class MaintenanceTicketCreate(SQLModel):
    building_id: int
    alert_id: Optional[int] = None
    title: str
    description: str
    priority: str = "MEDIUM"
    assigned_to: Optional[str] = "Equipo de Mantenimiento General"


class MaintenanceTicketUpdate(SQLModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
