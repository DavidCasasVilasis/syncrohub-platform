# SPEC-02: Arquitectura Técnica y Contratos de API (Architecture & Contracts)

**Estado:** Aprobado  
**Versión:** 1.0.0  
**Fecha:** 2026-09-30  

---

## 1. Arquitectura del Sistema

```
syncrohub-platform/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── buildings.py      # CRUD Edificios y Zonas
│   │   │   │   ├── meters.py         # CRUD Contadores
│   │   │   │   ├── telemetry.py      # Ingesta y consulta de lecturas
│   │   │   │   ├── analytics.py      # KPIs, curvas de carga y facturación
│   │   │   │   ├── alerts.py         # Gestión de alertas
│   │   │   │   └── maintenance.py    # Gestión de tickets
│   │   ├── core/
│   │   │   ├── config.py             # Variables de entorno y configuración
│   │   │   └── database.py           # Conexión SQLite/PostgreSQL y Session
│   │   ├── models/                   # SQLModel / SQLAlchemy entities
│   │   │   ├── building.py
│   │   │   ├── meter.py
│   │   │   ├── reading.py
│   │   │   ├── alert.py
│   │   │   └── maintenance.py
│   │   ├── schemas/                  # Pydantic Request/Response DTOs
│   │   │   ├── telemetry.py
│   │   │   ├── analytics.py
│   │   │   └── billing.py
│   │   ├── services/                 # Lógica de cálculo y reglas
│   │   │   ├── energy_service.py     # Agregaciones temporales y curvas
│   │   │   ├── anomaly_service.py    # Detección de umbrales
│   │   │   ├── billing_service.py    # Tarifa 3 periodos y emisiones
│   │   │   └── seed_service.py       # Creador de datos realistas iniciales
│   │   └── main.py                   # FastAPI Application Entrypoint
│   ├── simulator/
│   │   └── iot_simulator.py          # Simulador de envío continuo de lecturas
│   ├── tests/
│   │   ├── test_telemetry.py
│   │   ├── test_analytics.py
│   │   └── test_billing.py
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/               # UI components
│   │   │   ├── MetricCard.tsx
│   │   │   ├── EnergyChart.tsx
│   │   │   ├── ZoneBreakdown.tsx
│   │   │   ├── AlertFeed.tsx
│   │   │   ├── MaintenanceModal.tsx
│   │   │   └── BillingCalculator.tsx
│   │   ├── services/
│   │   │   └── api.ts                # Axios/Fetch client tipado
│   │   ├── types/
│   │   │   └── index.ts              # Interfaces TypeScript alineadas
│   │   ├── App.tsx                   # Dashboard principal
│   │   └── main.tsx
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 2. Contratos de API REST (Endpoints v1)

| Método | Endpoint | Descripción | Body / Query | Respuesta |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Healthcheck y estado del sistema | - | `{"status": "ok", "version": "1.0.0"}` |
| `GET` | `/api/v1/buildings` | Listar edificios gestionados | - | `List[BuildingRead]` |
| `GET` | `/api/v1/buildings/{id}/summary` | Resumen KPIs del edificio (potencia actual, kWh hoy, coste hoy) | `?range=today\|7d\|30d` | `BuildingKPISummary` |
| `GET` | `/api/v1/buildings/{id}/energy-curve` | Curva de carga temporal (intervalos horarios) | `?start_date=&end_date=&interval=hour` | `EnergyCurveResponse` |
| `GET` | `/api/v1/buildings/{id}/zones` | Listar zonas del edificio con consumo acumulado | - | `List[ZoneWithEnergy]` |
| `GET` | `/api/v1/meters` | Listar contadores y su último estado | `?building_id=&zone_id=` | `List[MeterRead]` |
| `POST` | `/api/v1/telemetry/readings` | Ingesta masiva o unitaria de lecturas IoT | `List[ReadingCreate]` | `IngestionResponse` |
| `GET` | `/api/v1/alerts` | Listar alertas (filtrado por activas/resueltas) | `?building_id=&status=` | `List[AlertRead]` |
| `POST` | `/api/v1/alerts/{id}/ack` | Reconocer/cambiar estado de una alerta | - | `AlertRead` |
| `GET` | `/api/v1/maintenance/tickets`| Listar tickets de mantenimiento | `?building_id=&status=` | `List[TicketRead]` |
| `POST` | `/api/v1/maintenance/tickets`| Crear ticket de mantenimiento manual o desde alerta | `TicketCreate` | `TicketRead` |
| `PATCH`| `/api/v1/maintenance/tickets/{id}`| Actualizar estado de ticket | `TicketUpdate` | `TicketRead` |
| `GET` | `/api/v1/billing/estimate` | Cálculo estimado de factura por periodos tarifarios | `?building_id=&month=&year=` | `BillingEstimate` |

---

## 3. Interfaces TypeScript Espejo (Frontend Contracts)

```typescript
export interface Building {
  id: number;
  name: string;
  code: string;
  address: string;
  total_area_m2: number;
  contracted_power_kw: number;
}

export interface BuildingKPISummary {
  building_id: number;
  current_power_kw: number;
  contracted_power_kw: number;
  power_load_percentage: number;
  energy_today_kwh: number;
  cost_today_eur: number;
  active_alerts_count: number;
  open_tickets_count: number;
}

export interface EnergyPoint {
  timestamp: string;
  total_power_kw: number;
  energy_kwh: number;
  zone_breakdown: Record<string, number>;
}

export interface Alert {
  id: number;
  meter_id: number;
  meter_name: string;
  building_id: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  trigger_value: number;
  threshold_value: number;
  status: 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';
  created_at: string;
}

export interface MaintenanceTicket {
  id: number;
  building_id: number;
  alert_id?: number;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  assigned_to?: string;
  created_at: string;
}

export interface BillingEstimate {
  building_id: number;
  period_start: string;
  period_end: string;
  total_kwh: number;
  peak_kwh: number;
  flat_kwh: number;
  valley_kwh: number;
  peak_cost_eur: number;
  flat_cost_eur: number;
  valley_cost_eur: number;
  power_term_eur: number;
  total_cost_eur: number;
  co2_kg_emitted: number;
}
```
