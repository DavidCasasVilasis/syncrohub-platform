import random
from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select
from app.models.building import Building, Zone
from app.models.meter import Meter
from app.models.reading import Reading
from app.models.alert import Alert
from app.models.maintenance import MaintenanceTicket


def seed_database(session: Session) -> None:
    """Pobla la base de datos con edificios, zonas, contadores y 48h de telemetría realista."""
    existing = session.exec(select(Building)).first()
    if existing:
        return

    print("🌱 Iniciando carga de datos semilla (Smart Buildings & IoT)...")

    # 1. Edificios
    b1 = Building(
        name="Torre Castellana - Sede SyncroHub",
        code="BLD-MAD-01",
        address="Paseo de la Castellana 180",
        city="Madrid",
        total_area_m2=8400.0,
        contracted_power_kw=180.0,
        target_kwh_per_year=240000.0,
    )
    b2 = Building(
        name="Campus Tecnológico 22@",
        code="BLD-BCN-02",
        address="Carrer de Sancho de Ávila 65",
        city="Barcelona",
        total_area_m2=4200.0,
        contracted_power_kw=95.0,
        target_kwh_per_year=110000.0,
    )
    session.add(b1)
    session.add(b2)
    session.commit()
    session.refresh(b1)
    session.refresh(b2)

    # 2. Zonas para Torre Castellana
    zones_b1 = [
        Zone(name="Sala Técnica HVAC & Climatización", zone_type="HVAC", floor=-1, area_m2=450.0, building_id=b1.id),
        Zone(name="Data Center & Servidores Centrales", zone_type="IT_EQUIPMENT", floor=-1, area_m2=180.0, building_id=b1.id),
        Zone(name="Plantas 1-3: Oficinas y Puestos Operativos", zone_type="GENERAL", floor=1, area_m2=3600.0, building_id=b1.id),
        Zone(name="Alumbrado General y Zonas Comunes", zone_type="LIGHTING", floor=0, area_m2=1200.0, building_id=b1.id),
    ]
    for z in zones_b1:
        session.add(z)
    session.commit()
    for z in zones_b1:
        session.refresh(z)

    # 3. Contadores IoT para Torre Castellana
    meters_data = [
        ("MTR-HVAC-01", "Analizador General Enfriadora Chiller A", "HVAC", 80.0, zones_b1[0].id),
        ("MTR-UPS-01", "Contador Redundante SAI Sala Servidores", "IT_EQUIPMENT", 45.0, zones_b1[1].id),
        ("MTR-OFF-01", "Subcontador Planta 1-3 Tomas de Fuerza", "ELECTRICITY", 60.0, zones_b1[2].id),
        ("MTR-LGT-01", "Cuadro Alumbrado LED Smart DALI", "LIGHTING", 25.0, zones_b1[3].id),
    ]

    created_meters = []
    for serial, name, m_type, max_p, z_id in meters_data:
        m = Meter(
            serial_number=serial,
            name=name,
            meter_type=m_type,
            unit="kWh",
            max_rated_power_kw=max_p,
            status="ONLINE",
            zone_id=z_id,
            last_seen_at=datetime.now(timezone.utc)
        )
        session.add(m)
        created_meters.append((m, max_p, m_type))
    session.commit()

    # 4. Generación de 48 horas de telemetría IoT histórica
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    readings_to_add = []
    accumulated_energy = {m.id: 12450.0 for m, _, _ in created_meters}

    for hours_ago in range(48, -1, -1):
        timestamp = now - timedelta(hours=hours_ago)
        hour = timestamp.hour
        is_weekend = timestamp.weekday() in (5, 6)

        for meter, max_p, m_type in created_meters:
            if m_type == "IT_EQUIPMENT":
                power = max_p * random.uniform(0.65, 0.78)
            elif m_type == "HVAC":
                if not is_weekend and 8 <= hour <= 19:
                    power = max_p * random.uniform(0.55, 0.88)
                else:
                    power = max_p * random.uniform(0.10, 0.20)
            elif m_type == "ELECTRICITY":
                if not is_weekend and 8 <= hour <= 19:
                    power = max_p * random.uniform(0.40, 0.75)
                else:
                    power = max_p * random.uniform(0.05, 0.12)
            else:  # LIGHTING
                if not is_weekend and 7 <= hour <= 21:
                    power = max_p * random.uniform(0.50, 0.80)
                else:
                    power = max_p * random.uniform(0.02, 0.08)

            accumulated_energy[meter.id] += power * 1.0
            reading = Reading(
                meter_id=meter.id,
                timestamp=timestamp,
                active_energy_kwh=round(accumulated_energy[meter.id], 2),
                instant_power_kw=round(power, 2),
                reactive_energy_kvarh=round(power * 0.15, 2),
                voltage_v=round(230.0 + random.uniform(-2.5, 2.5), 1),
                current_a=round((power * 1000) / 230.0, 1),
            )
            readings_to_add.append(reading)

    for r in readings_to_add:
        session.add(r)
    session.commit()

    # 5. Alertas demostrativas preconfiguradas
    alert1 = Alert(
        building_id=b1.id,
        meter_id=created_meters[0][0].id,
        severity="WARNING",
        title="Pico de potencia cercano al límite en Enfriadora Chiller A",
        description="Potencia instantánea alcanzó 73.5 kW (92% de la capacidad nominal de 80.0 kW).",
        trigger_value=73.5,
        threshold_value=72.0,
        status="ACTIVE",
        created_at=now - timedelta(hours=3),
    )
    alert2 = Alert(
        building_id=b1.id,
        meter_id=created_meters[2][0].id,
        severity="INFO",
        title="Consumo residual fuera de horario en Planta 1",
        description="Consumo nocturno continuo superior a 5 kW detectado entre las 02:00 y las 05:00.",
        trigger_value=5.8,
        threshold_value=3.0,
        status="ACTIVE",
        created_at=now - timedelta(hours=8),
    )
    session.add(alert1)
    session.add(alert2)
    session.commit()
    session.refresh(alert1)

    # 6. Ticket de mantenimiento demostrativo
    ticket1 = MaintenanceTicket(
        building_id=b1.id,
        alert_id=alert1.id,
        title="Revisión preventiva de compresor Chiller A",
        description="Verificar presiones de gas refrigerante y amperaje de arranque tras registrar picos por encima del 90%.",
        priority="HIGH",
        status="IN_PROGRESS",
        assigned_to="Carlos Sánchez (Técnico Climatización)",
        created_at=now - timedelta(hours=2),
    )
    session.add(ticket1)
    session.commit()

    print("✅ Datos semilla cargados con éxito.")
