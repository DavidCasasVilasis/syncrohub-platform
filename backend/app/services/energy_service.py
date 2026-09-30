from datetime import datetime, timedelta, timezone
from typing import List, Dict
from sqlmodel import Session, select
from app.models.building import Building, Zone
from app.models.meter import Meter
from app.models.reading import Reading
from app.models.alert import Alert
from app.models.maintenance import MaintenanceTicket
from app.schemas.analytics import (
    BuildingKPISummary,
    EnergyPoint,
    EnergyCurveResponse,
    ZoneEnergySummary,
)
from app.core.config import settings


def get_building_kpi_summary(session: Session, building_id: int) -> BuildingKPISummary:
    """Calcula el resumen de indicadores clave (KPIs) en tiempo real para un edificio."""
    building = session.get(Building, building_id)
    if not building:
        raise ValueError(f"Edificio {building_id} no encontrado")

    zones = session.exec(select(Zone).where(Zone.building_id == building_id)).all()
    zone_ids = [z.id for z in zones]
    meters = session.exec(select(Meter).where(Meter.zone_id.in_(zone_ids))).all()
    meter_ids = [m.id for m in meters]

    now = datetime.now(timezone.utc)
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_yesterday = start_today - timedelta(days=1)
    end_yesterday = start_today

    # 1. Potencia actual: suma de la última lectura de cada contador
    current_power = 0.0
    for m in meters:
        last_reading = session.exec(
            select(Reading)
            .where(Reading.meter_id == m.id)
            .order_by(Reading.timestamp.desc())
        ).first()
        if last_reading:
            current_power += last_reading.instant_power_kw

    # 2. Consumo acumulado hoy (kWh)
    readings_today = session.exec(
        select(Reading)
        .where(Reading.meter_id.in_(meter_ids))
        .where(Reading.timestamp >= start_today)
    ).all()
    energy_today = sum(r.instant_power_kw for r in readings_today)

    # 3. Consumo acumulado ayer mismo periodo
    readings_yesterday = session.exec(
        select(Reading)
        .where(Reading.meter_id.in_(meter_ids))
        .where(Reading.timestamp >= start_yesterday)
        .where(Reading.timestamp < end_yesterday)
    ).all()
    energy_yesterday = sum(r.instant_power_kw for r in readings_yesterday)

    # Variación porcentual
    variation = 0.0
    if energy_yesterday > 0:
        variation = round(((energy_today - energy_yesterday) / energy_yesterday) * 100, 1)

    # 4. Alertas y tickets activos
    active_alerts = len(session.exec(
        select(Alert)
        .where(Alert.building_id == building_id)
        .where(Alert.status == "ACTIVE")
    ).all())

    open_tickets = len(session.exec(
        select(MaintenanceTicket)
        .where(MaintenanceTicket.building_id == building_id)
        .where(MaintenanceTicket.status.in_(["OPEN", "IN_PROGRESS"]))
    ).all())

    cost_today = energy_today * settings.FLAT_RATE_EUR_KWH
    co2_today = energy_today * settings.DEFAULT_CO2_FACTOR_KG_PER_KWH
    load_pct = round((current_power / building.contracted_power_kw) * 100, 1) if building.contracted_power_kw > 0 else 0.0

    return BuildingKPISummary(
        building_id=building.id or 0,
        building_name=building.name,
        current_power_kw=round(current_power, 2),
        contracted_power_kw=round(building.contracted_power_kw, 2),
        power_load_percentage=load_pct,
        energy_today_kwh=round(energy_today, 2),
        energy_yesterday_kwh=round(energy_yesterday, 2),
        variation_percentage=variation,
        cost_today_eur=round(cost_today, 2),
        active_alerts_count=active_alerts,
        open_tickets_count=open_tickets,
        co2_today_kg=round(co2_today, 2),
    )


def get_energy_curve(
    session: Session,
    building_id: int,
    hours_back: int = 24
) -> EnergyCurveResponse:
    """Genera la curva de carga horaria con desglose por zonas operativas."""
    now = datetime.now(timezone.utc)
    start_time = now - timedelta(hours=hours_back)

    zones = session.exec(select(Zone).where(Zone.building_id == building_id)).all()
    zone_dict = {z.id: z.name for z in zones}

    meters = session.exec(select(Meter).where(Meter.zone_id.in_(list(zone_dict.keys())))).all()
    meter_zone_map = {m.id: zone_dict.get(m.zone_id, "Desconocida") for m in meters}
    meter_ids = list(meter_zone_map.keys())

    readings = session.exec(
        select(Reading)
        .where(Reading.meter_id.in_(meter_ids))
        .where(Reading.timestamp >= start_time)
        .order_by(Reading.timestamp.asc())
    ).all()

    hourly_buckets: Dict[str, Dict[str, float]] = {}
    for r in readings:
        hour_key = r.timestamp.strftime("%H:00")
        if hour_key not in hourly_buckets:
            hourly_buckets[hour_key] = {"total_power": 0.0, "total_energy": 0.0}
            for z_name in zone_dict.values():
                hourly_buckets[hour_key][z_name] = 0.0

        zone_name = meter_zone_map.get(r.meter_id, "General")
        hourly_buckets[hour_key]["total_power"] += r.instant_power_kw
        hourly_buckets[hour_key]["total_energy"] += r.instant_power_kw * 1.0
        hourly_buckets[hour_key][zone_name] = (
            hourly_buckets[hour_key].get(zone_name, 0.0) + r.instant_power_kw
        )

    points: List[EnergyPoint] = []
    for hour_key, bucket in hourly_buckets.items():
        points.append(
            EnergyPoint(
                timestamp=hour_key,
                total_power_kw=round(bucket["total_power"], 2),
                energy_kwh=round(bucket["total_energy"], 2),
                zone_breakdown={
                    k: round(v, 2)
                    for k, v in bucket.items()
                    if k not in ("total_power", "total_energy")
                },
            )
        )

    return EnergyCurveResponse(
        building_id=building_id,
        interval="hour",
        points=points,
    )


def get_zones_summary(session: Session, building_id: int) -> List[ZoneEnergySummary]:
    """Obtiene el resumen de consumo y potencia por cada zona del edificio."""
    zones = session.exec(select(Zone).where(Zone.building_id == building_id)).all()
    summaries: List[ZoneEnergySummary] = []
    total_building_energy = 0.0

    raw_zone_data = []
    for zone in zones:
        meters = session.exec(select(Meter).where(Meter.zone_id == zone.id)).all()
        meter_ids = [m.id for m in meters]
        zone_power = 0.0
        zone_energy = 0.0

        for m_id in meter_ids:
            last = session.exec(
                select(Reading)
                .where(Reading.meter_id == m_id)
                .order_by(Reading.timestamp.desc())
            ).first()
            if last:
                zone_power += last.instant_power_kw

            day_ago = datetime.now(timezone.utc) - timedelta(hours=24)
            readings = session.exec(
                select(Reading)
                .where(Reading.meter_id == m_id)
                .where(Reading.timestamp >= day_ago)
            ).all()
            zone_energy += sum(r.instant_power_kw for r in readings)

        total_building_energy += zone_energy
        raw_zone_data.append((zone, zone_power, zone_energy))

    if total_building_energy == 0:
        total_building_energy = 1.0

    for zone, power, energy in raw_zone_data:
        summaries.append(
            ZoneEnergySummary(
                zone_id=zone.id or 0,
                name=zone.name,
                zone_type=zone.zone_type,
                floor=zone.floor,
                area_m2=zone.area_m2,
                current_power_kw=round(power, 2),
                total_energy_kwh=round(energy, 2),
                percentage_of_total=round((energy / total_building_energy) * 100, 1),
            )
        )

    return summaries
