from pydantic import BaseModel, Field
from typing import Optional


class TariffBreakdown(BaseModel):
    period: str = Field(..., description="PUNTA, LLANO o VALLE")
    kwh: float
    rate_eur_per_kwh: float
    cost_eur: float
    percentage_of_energy: float


class BillingEstimate(BaseModel):
    building_id: int
    building_name: str
    period_start: str
    period_end: str
    total_kwh: float
    breakdown: list[TariffBreakdown]
    energy_cost_eur: float
    power_term_eur: float = Field(..., description="Término fijo de potencia contratada")
    taxes_eur: float = Field(..., description="Impuesto eléctrico + IVA estimado")
    total_invoice_eur: float
    co2_kg_emitted: float
    tree_offset_equivalent: int = Field(..., description="Árboles necesarios para compensar la huella")
