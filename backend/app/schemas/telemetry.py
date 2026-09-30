from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ReadingCreate(BaseModel):
    meter_id: int = Field(..., description="ID del contador medidor")
    timestamp: datetime = Field(default_factory=get_utc_now, description="Fecha y hora de la lectura")
    active_energy_kwh: float = Field(..., ge=0, description="Lectura acumulada de energía activa en kWh")
    instant_power_kw: float = Field(..., ge=0, description="Potencia instantánea activa en kW")
    reactive_energy_kvarh: Optional[float] = Field(default=0.0, ge=0)
    voltage_v: Optional[float] = Field(default=230.0, ge=0)
    current_a: Optional[float] = Field(default=0.0, ge=0)


class BatchReadingCreate(BaseModel):
    readings: List[ReadingCreate] = Field(..., description="Lista de lecturas de telemetría IoT")


class IngestionResponse(BaseModel):
    inserted_count: int
    alerts_triggered_count: int
    message: str
