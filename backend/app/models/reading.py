from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ReadingBase(SQLModel):
    meter_id: int = Field(foreign_key="meters.id", index=True)
    timestamp: datetime = Field(index=True)
    active_energy_kwh: float = Field(description="Lectura acumulada de energía activa en kWh")
    instant_power_kw: float = Field(description="Potencia instantánea en kW")
    reactive_energy_kvarh: Optional[float] = Field(default=0.0)
    voltage_v: Optional[float] = Field(default=230.0)
    current_a: Optional[float] = Field(default=0.0)


class Reading(ReadingBase, table=True):
    __tablename__ = "readings"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=get_utc_now)

    # Relaciones
    meter: Optional["Meter"] = Relationship(back_populates="readings")


class ReadingRead(ReadingBase):
    id: int
    created_at: datetime
