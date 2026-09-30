from datetime import datetime, timezone
from fastapi.testclient import TestClient


def test_healthcheck(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "SyncroHub" in data["service"]


def test_list_buildings(client: TestClient):
    response = client.get("/api/v1/buildings")
    assert response.status_code == 200
    buildings = response.json()
    assert len(buildings) >= 2
    assert any(b["code"] == "BLD-MAD-01" for b in buildings)


def test_building_kpi_summary(client: TestClient):
    response = client.get("/api/v1/buildings/1/summary")
    assert response.status_code == 200
    summary = response.json()
    assert summary["building_id"] == 1
    assert summary["contracted_power_kw"] == 180.0
    assert summary["current_power_kw"] > 0
    assert summary["energy_today_kwh"] > 0


def test_building_energy_curve(client: TestClient):
    response = client.get("/api/v1/buildings/1/energy-curve?hours_back=24")
    assert response.status_code == 200
    curve = response.json()
    assert curve["building_id"] == 1
    assert len(curve["points"]) > 0
    assert "total_power_kw" in curve["points"][0]


def test_building_zones(client: TestClient):
    response = client.get("/api/v1/buildings/1/zones")
    assert response.status_code == 200
    zones = response.json()
    assert len(zones) >= 4
    assert any(z["zone_type"] == "HVAC" for z in zones)


def test_meters_listing(client: TestClient):
    response = client.get("/api/v1/meters")
    assert response.status_code == 200
    meters = response.json()
    assert len(meters) >= 4
    assert any(m["serial_number"] == "MTR-HVAC-01" for m in meters)


def test_telemetry_ingestion_and_anomaly_detection(client: TestClient):
    # Inyectar una lectura que sobrepasa el 90% del contador nominal (contador 1 tiene 80 kW max)
    payload = {
        "readings": [
            {
                "meter_id": 1,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "active_energy_kwh": 15000.5,
                "instant_power_kw": 78.0,  # > 90% de 80 kW
                "reactive_energy_kvarh": 10.0,
                "voltage_v": 231.0,
                "current_a": 337.0,
            }
        ]
    }
    response = client.post("/api/v1/telemetry/readings", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["inserted_count"] == 1
    assert data["alerts_triggered_count"] >= 1


def test_alerts_and_acknowledgment(client: TestClient):
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) > 0
    alert_id = alerts[0]["id"]

    # Reconocer alerta
    ack_response = client.post(f"/api/v1/alerts/{alert_id}/acknowledge")
    assert ack_response.status_code == 200
    assert ack_response.json()["status"] == "ACKNOWLEDGED"


def test_maintenance_ticket_lifecycle(client: TestClient):
    ticket_payload = {
        "building_id": 1,
        "title": "Mantenimiento Preventivo Filtros Clima",
        "description": "Sustitución semestral de filtros F7 en climatizadoras",
        "priority": "MEDIUM",
        "assigned_to": "Técnico Especialista Climatización",
    }
    create_res = client.post("/api/v1/maintenance/tickets", json=ticket_payload)
    assert create_res.status_code == 200
    ticket = create_res.json()
    assert ticket["title"] == ticket_payload["title"]
    assert ticket["status"] == "OPEN"

    # Actualizar a completado
    patch_res = client.patch(
        f"/api/v1/maintenance/tickets/{ticket['id']}",
        json={"status": "COMPLETED"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "COMPLETED"


def test_billing_estimate(client: TestClient):
    response = client.get("/api/v1/billing/estimate?building_id=1&days=30")
    assert response.status_code == 200
    billing = response.json()
    assert billing["building_id"] == 1
    assert billing["total_kwh"] > 0
    assert billing["total_invoice_eur"] > 0
    assert len(billing["breakdown"]) == 3
    assert billing["co2_kg_emitted"] > 0
