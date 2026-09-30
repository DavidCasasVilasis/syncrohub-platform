from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MeterBase(SQLModel):
    serial_number: str = Field(unique=True, index=True)
    name: str = Field(index=True)
    meter_type: str = Field(default="ELECTRICITY", description="ELECTRICITY, HVAC, LIGHTING, SERVER, WATER")
    unit: str = Field(default="kWh")
    max_rated_power_kw: float = Field(default=50.0)
    status: str = Field(default="ONLINE", description="ONLINE, OFFLINE, WARNING, ERROR")
    zone_id: int = Field(foreign_key="zones.id", index=True)


class Meter(MeterBase, table=True):
    __tablename__ = "meters"

    id: Optional[int] = Field(default=None, primary_key=True)
    last_seen_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=get_utc_now)

    # Relaciones
    zone: Optional["Zone"] = Relationship(back_populates="meters")
    readings: List["Reading"] = Relationship(back_populates="meter", cascade_delete=True)
    alerts: List["Alert"] = Relationship(back_populates="meter", cascade_delete=True)


class MeterRead(MeterBase):
    id: int
    last_seen_at: Optional[datetime] = None
    created_at: datetime
