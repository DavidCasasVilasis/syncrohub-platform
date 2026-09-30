from datetime import datetime, timedelta
from typing import List, Tuple
from sqlmodel import Session, select
from app.models.reading import Reading
from app.models.meter import Meter
from app.models.building import Building, Zone
from app.schemas.billing import BillingEstimate, TariffBreakdown
from app.core.config import settings


def get_tariff_period(dt: datetime) -> str:
    """
    Determina el tramo tarifario (PUNTA, LLANO, VALLE) según normativa española 2.0TD / 3.0TD.
    - Fines de semana: 100% VALLE
    - Días laborables:
        - 00:00 - 08:00: VALLE
        - 08:00 - 10:00, 14:00 - 18:00, 22:00 - 24:00: LLANO
        - 10:00 - 14:00, 18:00 - 22:00: PUNTA
    """
    # 5 = Sábado, 6 = Domingo
    if dt.weekday() in (5, 6):
        return "VALLE"

    hour = dt.hour
    if hour < 8:
        return "VALLE"
    elif (10 <= hour < 14) or (18 <= hour < 22):
        return "PUNTA"
    else:
        return "LLANO"


def calculate_billing(
    session: Session,
    building_id: int,
    start_date: datetime,
    end_date: datetime
) -> BillingEstimate:
    """Calcula la estimación de costes eléctricos y huella de carbono para un edificio."""
    building = session.get(Building, building_id)
    if not building:
        raise ValueError(f"Edificio con ID {building_id} no encontrado")

    # Obtener contadores del edificio
    zones = session.exec(select(Zone).where(Zone.building_id == building_id)).all()
    zone_ids = [z.id for z in zones]
    meters = session.exec(select(Meter).where(Meter.zone_id.in_(zone_ids))).all()
    meter_ids = [m.id for m in meters]

    # Obtener lecturas en el periodo
    readings = session.exec(
        select(Reading)
        .where(Reading.meter_id.in_(meter_ids))
        .where(Reading.timestamp >= start_date)
        .where(Reading.timestamp <= end_date)
        .order_by(Reading.timestamp.asc())
    ).all()

    # Acumuladores de kWh por tramo
    kwh_by_period = {"PUNTA": 0.0, "LLANO": 0.0, "VALLE": 0.0}

    # Aproximación horaria de energía basada en potencia instantánea (kW * 1h si son muestras horarias)
    # o cálculo directo de incrementos de lectura activa
    for r in readings:
        period = get_tariff_period(r.timestamp)
        # Asumiendo telemetría por intervalos, aproximamos energía del punto si instant_power_kw está disponible
        approx_kwh = r.instant_power_kw * 1.0  # Muestra promedio hora
        kwh_by_period[period] += approx_kwh

    total_kwh = sum(kwh_by_period.values())
    if total_kwh == 0:
        total_kwh = 1.0  # Evitar división por cero

    peak_kwh = kwh_by_period["PUNTA"]
    flat_kwh = kwh_by_period["LLANO"]
    valley_kwh = kwh_by_period["VALLE"]

    peak_cost = peak_kwh * settings.PEAK_RATE_EUR_KWH
    flat_cost = flat_kwh * settings.FLAT_RATE_EUR_KWH
    valley_cost = valley_kwh * settings.VALLEY_RATE_EUR_KWH

    energy_cost = peak_cost + flat_cost + valley_cost

    # Término fijo de potencia (aprox 0.11 € / kW contratado / día)
    days = max(1, (end_date - start_date).days)
    power_term = building.contracted_power_kw * 0.11 * days

    # Impuesto eléctrico (5.11%) + IVA (21%)
    subtotal = energy_cost + power_term
    electric_tax = subtotal * 0.0511
    iva = (subtotal + electric_tax) * 0.21
    total_invoice = subtotal + electric_tax + iva

    # Emisiones CO2 y compensación de árboles (1 árbol absorbe aprox 20-25 kg CO2 al año)
    co2_kg = total_kwh * settings.DEFAULT_CO2_FACTOR_KG_PER_KWH
    trees_needed = max(1, int(co2_kg / 22.0))

    breakdown = [
        TariffBreakdown(
            period="PUNTA",
            kwh=round(peak_kwh, 2),
            rate_eur_per_kwh=settings.PEAK_RATE_EUR_KWH,
            cost_eur=round(peak_cost, 2),
            percentage_of_energy=round((peak_kwh / total_kwh) * 100, 1),
        ),
        TariffBreakdown(
            period="LLANO",
            kwh=round(flat_kwh, 2),
            rate_eur_per_kwh=settings.FLAT_RATE_EUR_KWH,
            cost_eur=round(flat_cost, 2),
            percentage_of_energy=round((flat_kwh / total_kwh) * 100, 1),
        ),
        TariffBreakdown(
            period="VALLE",
            kwh=round(valley_kwh, 2),
            rate_eur_per_kwh=settings.VALLEY_RATE_EUR_KWH,
            cost_eur=round(valley_cost, 2),
            percentage_of_energy=round((valley_kwh / total_kwh) * 100, 1),
        ),
    ]

    return BillingEstimate(
        building_id=building.id or 0,
        building_name=building.name,
        period_start=start_date.strftime("%Y-%m-%d"),
        period_end=end_date.strftime("%Y-%m-%d"),
        total_kwh=round(total_kwh, 2),
        breakdown=breakdown,
        energy_cost_eur=round(energy_cost, 2),
        power_term_eur=round(power_term, 2),
        taxes_eur=round(electric_tax + iva, 2),
        total_invoice_eur=round(total_invoice, 2),
        co2_kg_emitted=round(co2_kg, 2),
        tree_offset_equivalent=trees_needed,
    )
