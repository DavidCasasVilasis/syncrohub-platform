from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AlertBase(SQLModel):
    building_id: int = Field(index=True)
    meter_id: int = Field(foreign_key="meters.id", index=True)
    severity: str = Field(default="WARNING", description="CRITICAL, WARNING, INFO")
    title: str
    description: str
    trigger_value: float
    threshold_value: float
    status: str = Field(default="ACTIVE", description="ACTIVE, RESOLVED, ACKNOWLEDGED")


class Alert(AlertBase, table=True):
    __tablename__ = "alerts"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=get_utc_now)
    resolved_at: Optional[datetime] = Field(default=None)

    # Relaciones
    meter: Optional["Meter"] = Relationship(back_populates="alerts")


class AlertRead(AlertBase):
    id: int
    created_at: datetime
    resolved_at: Optional[datetime] = None
    meter_name: Optional[str] = None
