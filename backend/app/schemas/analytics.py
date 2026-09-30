from typing import List, Dict, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class BuildingKPISummary(BaseModel):
    building_id: int
    building_name: str
    current_power_kw: float = Field(..., description="Potencia instantánea total actual del edificio")
    contracted_power_kw: float
    power_load_percentage: float = Field(..., description="Porcentaje de potencia actual sobre la contratada")
    energy_today_kwh: float = Field(..., description="Consumo acumulado hoy en kWh")
    energy_yesterday_kwh: float = Field(..., description="Consumo en el mismo periodo ayer")
    variation_percentage: float = Field(..., description="% de variación respecto a ayer")
    cost_today_eur: float = Field(..., description="Coste estimado hoy en euros")
    active_alerts_count: int
    open_tickets_count: int
    co2_today_kg: float


class EnergyPoint(BaseModel):
    timestamp: str = Field(..., description="Etiqueta temporal (ej. HH:00 o YYYY-MM-DD)")
    total_power_kw: float
    energy_kwh: float
    zone_breakdown: Dict[str, float] = Field(default_factory=dict, description="Consumo por zona en kWh")


class EnergyCurveResponse(BaseModel):
    building_id: int
    interval: str
    points: List[EnergyPoint]


class ZoneEnergySummary(BaseModel):
    zone_id: int
    name: str
    zone_type: str
    floor: int
    area_m2: float
    current_power_kw: float
    total_energy_kwh: float
    percentage_of_total: float
