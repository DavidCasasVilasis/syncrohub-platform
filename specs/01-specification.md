# SPEC-01: Especificación Funcional de SyncroHub Smart Building Platform

**Estado:** Aprobado  
**Versión:** 1.0.0  
**Fecha:** 2026-09-30  
**Metodología:** Spec-Driven Development (SDD)  

---

## 1. Visión y Propósito del Producto
SyncroHub es una plataforma de gestión inteligente de edificios (BMS / PropTech) orientada a la centralización de:
- **Gestión de infraestructuras y espacios:** Edificios, plantas y zonas operativas.
- **Monitorización y eficiencia energética:** Telemetría en tiempo real e histórica de contadores (electricidad general, climatización/HVAC, iluminación, servidores).
- **Mantenimiento predictivo y correctivo:** Detección de anomalías de consumo y generación automatizada de órdenes/tickets de mantenimiento.
- **Facturación y costes energéticos:** Simulación y desglose económico en base a tarifas por periodos horarios (Punta, Llano, Valle).
- **APIs abiertas para IoT y terceros:** Ingesta estandarizada para sensores, concentradores de datos (modbus/BACnet/MQTT a REST) y ERPs.

---

## 2. Entidades de Dominio

### 2.1 Edificio (`Building`)
- Representa un inmueble o complejo físico gestionado.
- Atributos: `id`, `name`, `code`, `address`, `city`, `total_area_m2`, `contracted_power_kw`, `created_at`.

### 2.2 Zona (`Zone`)
- Subdivisión espacial o funcional dentro de un edificio (ej. "Planta 1 - Oficinas", "Sótano - Sala de Máquinas HVAC", "Planta 3 - Data Center").
- Atributos: `id`, `building_id`, `name`, `zone_type` (`HVAC`, `LIGHTING`, `IT_EQUIPMENT`, `GENERAL`), `floor`, `area_m2`.

### 2.3 Contador / Dispositivo IoT (`Meter`)
- Dispositivo físico o virtual que mide el consumo de energía en un punto de la instalación.
- Atributos: `id`, `zone_id`, `serial_number`, `name`, `meter_type` (`ELECTRICITY`, `WATER`, `GAS`), `unit` (`kWh`, `m3`), `max_rated_power_kw`, `status` (`ONLINE`, `OFFLINE`, `WARNING`), `last_seen_at`.

### 2.4 Lectura de Telemetría (`Reading`)
- Registro temporal de medición generado por un contador.
- Atributos: `id`, `meter_id`, `timestamp`, `active_energy_kwh` (acumulada), `instant_power_kw` (potencia activa), `reactive_energy_kvarh`, `voltage_v`, `current_a`.

### 2.5 Regla de Alerta y Notificación (`Alert`)
- Evento generado automáticamente cuando una métrica viola umbrales de seguridad u horarios operativos.
- Atributos: `id`, `meter_id`, `building_id`, `severity` (`CRITICAL`, `WARNING`, `INFO`), `title`, `description`, `trigger_value`, `threshold_value`, `status` (`ACTIVE`, `RESOLVED`, `ACKNOWLEDGED`), `created_at`.

### 2.6 Ticket de Mantenimiento (`MaintenanceTicket`)
- Incidencia técnica asociada a un edificio o equipo para resolución por parte del equipo de mantenimiento.
- Atributos: `id`, `building_id`, `alert_id` (opcional), `title`, `description`, `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), `status` (`OPEN`, `IN_PROGRESS`, `COMPLETED`), `assigned_to`, `created_at`, `resolved_at`.

### 2.7 Simulación de Facturación (`BillingSummary`)
- Estimación económica de consumo para un periodo dado y un edificio/zona.
- Atributos: `period_start`, `period_end`, `total_kwh`, `cost_peak_eur`, `cost_flat_eur`, `cost_valley_eur`, `total_cost_eur`, `co2_kg_emitted`.

---

## 3. Casos de Uso Principales

1. **CU-01 Ingesta de Telemetría IoT:**
   - Un concentrador IoT envía lecturas individuales o por lotes vía API REST (`POST /api/v1/telemetry/readings`).
   - El sistema valida el contador, registra las métricas y evalúa reglas de alerta en tiempo real.
2. **CU-02 Dashboard de Supervisión Energética:**
   - Visualización de KPIs clave: Potencia instantánea total, consumo acumulado hoy vs. ayer, porcentaje respecto al límite contratado, alertas activas.
   - Curva de carga horaria (gráfico de área/líneas) con desglose por zonas.
3. **CU-03 Detección de Consumos Anómalos:**
   - Regla 1: Potencia instantánea > 90% de la potencia máxima del contador o edificio (Riesgo de penalización por maxímetro).
   - Regla 2: Consumo significativo en horarios nocturnos / fines de semana en zonas de oficina (Consumo fantasma).
4. **CU-04 Generación de Incidencias de Mantenimiento:**
   - Conversión directa de una alerta crítica en ticket de mantenimiento con un clic o automáticamente.
5. **CU-05 Cálculo y Comparativa de Costes (Facturación):**
   - Aplicación de tarifa 3 periodos:
     - **Punta (Peak):** 10:00 - 14:00 y 18:00 - 22:00 (ej. 0.24 €/kWh).
     - **Llano (Flat):** 08:00 - 10:00, 14:00 - 18:00 y 22:00 - 00:00 (ej. 0.16 €/kWh).
     - **Valle (Valley):** 00:00 - 08:00 y fines de semana (ej. 0.10 €/kWh).
   - Cálculo de emisiones aproximadas de $CO_2$ ($0.25\text{ kg CO}_2 / \text{kWh}$).
