"""
Simulador de Concentrador / Gateway IoT para SyncroHub.
Envía telemetría periódica simulando analizadores de redes y contadores inteligentes en tiempo real.
Permite inyectar anomalías deliberadas para probar las alertas automáticas.
"""

import time
import random
import argparse
from datetime import datetime, timezone
import httpx

API_BASE_URL = "http://127.0.0.1:8000/api/v1"


def simulate_tick(client: httpx.Client, inject_spike: bool = False):
    now = datetime.now(timezone.utc)
    hour = now.hour
    is_weekend = now.weekday() in (5, 6)

    # Definición de contadores a simular (IDs 1 a 4 creados por seed)
    meters_config = [
        {"id": 1, "name": "Enfriadora Chiller A (HVAC)", "max_p": 80.0, "type": "HVAC"},
        {"id": 2, "name": "SAI Sala Servidores (IT)", "max_p": 45.0, "type": "IT"},
        {"id": 3, "name": "Subcontador Planta 1-3 (Offices)", "max_p": 60.0, "type": "OFFICE"},
        {"id": 4, "name": "Cuadro Alumbrado LED DALI", "max_p": 25.0, "type": "LIGHTING"},
    ]

    readings = []
    for m in meters_config:
        max_p = m["max_p"]
        m_type = m["type"]

        if m["id"] == 1 and inject_spike:
            # Forzar sobrecarga > 90% para disparar alerta crítica
            power = max_p * 0.95
            print(f"  ⚠️  [SIMULADOR] Inyectando sobrecarga deliberada en {m['name']}: {power:.2f} kW")
        elif m_type == "IT":
            power = max_p * random.uniform(0.68, 0.76)
        elif m_type == "HVAC":
            if not is_weekend and 8 <= hour <= 19:
                power = max_p * random.uniform(0.50, 0.82)
            else:
                power = max_p * random.uniform(0.12, 0.18)
        elif m_type == "OFFICE":
            if not is_weekend and 8 <= hour <= 19:
                power = max_p * random.uniform(0.40, 0.70)
            else:
                power = max_p * random.uniform(0.04, 0.10)
        else:
            if not is_weekend and 7 <= hour <= 21:
                power = max_p * random.uniform(0.45, 0.75)
            else:
                power = max_p * random.uniform(0.03, 0.08)

        voltage = round(230.0 + random.uniform(-2.0, 2.0), 1)
        current = round((power * 1000) / voltage, 1)

        readings.append({
            "meter_id": m["id"],
            "timestamp": now.isoformat(),
            "active_energy_kwh": round(15000.0 + random.uniform(10, 50), 2),
            "instant_power_kw": round(power, 2),
            "reactive_energy_kvarh": round(power * 0.12, 2),
            "voltage_v": voltage,
            "current_a": current,
        })

    payload = {"readings": readings}
    try:
        res = client.post(f"{API_BASE_URL}/telemetry/readings", json=payload, timeout=5.0)
        if res.status_code == 200:
            data = res.json()
            print(
                f"[{now.strftime('%H:%M:%S')}] 📡 4 contadores reportados. "
                f"Insertados: {data['inserted_count']} | Alertas: {data['alerts_triggered_count']}"
            )
        else:
            print(f"❌ Error al enviar telemetría ({res.status_code}): {res.text}")
    except Exception as e:
        print(f"⚠️ No se pudo conectar a {API_BASE_URL}: {e}")


def main():
    parser = argparse.ArgumentParser(description="Simulador de Concentrador IoT de SyncroHub")
    parser.add_argument("--interval", type=int, default=5, help="Segundos entre lecturas (default: 5s)")
    parser.add_argument("--once", action="store_true", help="Enviar un único paquete y salir")
    parser.add_argument("--spike", action="store_true", help="Inyectar pico anómalo para activar alertas")
    args = parser.parse_args()

    print("=" * 60)
    print("   SyncroHub IoT Telemetry Simulator")
    print(f"   Destino: {API_BASE_URL}")
    print(f"   Intervalo: {args.interval}s | Inyección pico: {args.spike}")
    print("=" * 60)

    with httpx.Client() as client:
        if args.once:
            simulate_tick(client, inject_spike=args.spike)
            return

        while True:
            simulate_tick(client, inject_spike=args.spike)
            time.sleep(args.interval)


if __name__ == "__main__":
    main()
