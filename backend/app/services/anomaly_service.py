from typing import List, Optional
from datetime import datetime
from sqlmodel import Session, select
from app.models.meter import Meter
from app.models.reading import Reading
from app.models.alert import Alert
from app.models.building import Building, Zone


def evaluate_reading_anomalies(session: Session, reading: Reading, meter: Meter) -> List[Alert]:
    """
    Evalúa una lectura IoT entrante frente a reglas de umbral y hábitos de consumo.
    Si se detecta anomalía, genera y almacena la alerta correspondiente.
    """
    generated_alerts: List[Alert] = []

    # 1. Regla de Sobrecarga: Potencia instantánea > 90% de la capacidad nominal del contador
    threshold_power = meter.max_rated_power_kw * 0.90
    if reading.instant_power_kw >= threshold_power:
        severity = "CRITICAL" if reading.instant_power_kw >= meter.max_rated_power_kw else "WARNING"
        title = f"Sobrecarga detectada en {meter.name}"
        desc = (
            f"Potencia registrada de {reading.instant_power_kw:.2f} kW excede el "
            f"umbral de seguridad ({threshold_power:.2f} kW / 90% de {meter.max_rated_power_kw:.2f} kW)."
        )
        
        # Verificar si ya existe una alerta activa similar reciente para evitar duplicados en bucle
        recent_alert = session.exec(
            select(Alert)
            .where(Alert.meter_id == meter.id)
            .where(Alert.status == "ACTIVE")
            .where(Alert.title == title)
        ).first()

        if not recent_alert:
            zone = session.get(Zone, meter.zone_id)
            building_id = zone.building_id if zone else 1
            alert = Alert(
                building_id=building_id,
                meter_id=meter.id,
                severity=severity,
                title=title,
                description=desc,
                trigger_value=reading.instant_power_kw,
                threshold_value=threshold_power,
                status="ACTIVE",
                created_at=reading.timestamp
            )
            session.add(alert)
            generated_alerts.append(alert)

    # 2. Regla de Consumo Fantasma / Fuera de Horario:
    # Si la zona es de oficinas/general y es fin de semana (sábado/domingo) o madrugada (23:00 - 06:00),
    # y la potencia supera un 30% del nominal sin justificación.
    reading_dt = reading.timestamp
    is_weekend = reading_dt.weekday() in (5, 6)
    is_night = reading_dt.hour < 6 or reading_dt.hour >= 23

    zone = session.get(Zone, meter.zone_id)
    if zone and zone.zone_type in ("GENERAL", "LIGHTING") and (is_weekend or is_night):
        phantom_threshold = meter.max_rated_power_kw * 0.35
        if reading.instant_power_kw >= phantom_threshold:
            title = f"Consumo anómalo fuera de horario en {zone.name}"
            desc = (
                f"Consumo elevado ({reading.instant_power_kw:.2f} kW) detectado durante "
                f"{'fin de semana' if is_weekend else 'horario nocturno'} en zona {zone.name}."
            )
            existing_phantom = session.exec(
                select(Alert)
                .where(Alert.meter_id == meter.id)
                .where(Alert.status == "ACTIVE")
                .where(Alert.title == title)
            ).first()

            if not existing_phantom:
                alert = Alert(
                    building_id=zone.building_id,
                    meter_id=meter.id,
                    severity="WARNING",
                    title=title,
                    description=desc,
                    trigger_value=reading.instant_power_kw,
                    threshold_value=phantom_threshold,
                    status="ACTIVE",
                    created_at=reading.timestamp
                )
                session.add(alert)
                generated_alerts.append(alert)

    return generated_alerts
