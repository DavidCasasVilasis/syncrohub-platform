from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class BuildingBase(SQLModel):
    name: str = Field(index=True)
    code: str = Field(unique=True, index=True)
    address: str
    city: str
    total_area_m2: float
    contracted_power_kw: float
    target_kwh_per_year: Optional[float] = 120000.0


class Building(BuildingBase, table=True):
    __tablename__ = "buildings"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=get_utc_now)

    # Relaciones
    zones: List["Zone"] = Relationship(back_populates="building", cascade_delete=True)


class BuildingRead(BuildingBase):
    id: int
    created_at: datetime


class ZoneBase(SQLModel):
    name: str = Field(index=True)
    zone_type: str = Field(default="GENERAL", description="HVAC, LIGHTING, IT_EQUIPMENT, GENERAL")
    floor: int = Field(default=0)
    area_m2: float
    building_id: int = Field(foreign_key="buildings.id", index=True)


class Zone(ZoneBase, table=True):
    __tablename__ = "zones"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=get_utc_now)

    # Relaciones
    building: Optional[Building] = Relationship(back_populates="zones")
    meters: List["Meter"] = Relationship(back_populates="zone", cascade_delete=True)


class ZoneRead(ZoneBase):
    id: int
    created_at: datetime
