import type {
  Building,
  BuildingKPISummary,
  EnergyCurveResponse,
  ZoneEnergySummary,
  Meter,
  Alert,
  MaintenanceTicket,
  BillingEstimate,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

export const api = {
  // Edificios
  getBuildings: async (): Promise<Building[]> => {
    const res = await fetch(`${API_BASE}/buildings`);
    if (!res.ok) throw new Error('Error al obtener edificios');
    return res.json();
  },

  getBuildingSummary: async (buildingId: number): Promise<BuildingKPISummary> => {
    const res = await fetch(`${API_BASE}/buildings/${buildingId}/summary`);
    if (!res.ok) throw new Error('Error al obtener resumen de KPIs');
    return res.json();
  },

  getEnergyCurve: async (buildingId: number, hoursBack: number = 24): Promise<EnergyCurveResponse> => {
    const res = await fetch(`${API_BASE}/buildings/${buildingId}/energy-curve?hours_back=${hoursBack}`);
    if (!res.ok) throw new Error('Error al obtener curva energética');
    return res.json();
  },

  getZones: async (buildingId: number): Promise<ZoneEnergySummary[]> => {
    const res = await fetch(`${API_BASE}/buildings/${buildingId}/zones`);
    if (!res.ok) throw new Error('Error al obtener zonas');
    return res.json();
  },

  // Contadores
  getMeters: async (): Promise<Meter[]> => {
    const res = await fetch(`${API_BASE}/meters`);
    if (!res.ok) throw new Error('Error al obtener contadores');
    return res.json();
  },

  // Alertas
  getAlerts: async (buildingId?: number): Promise<Alert[]> => {
    const url = buildingId ? `${API_BASE}/alerts?building_id=${buildingId}` : `${API_BASE}/alerts`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al obtener alertas');
    return res.json();
  },

  acknowledgeAlert: async (alertId: number): Promise<Alert> => {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al reconocer alerta');
    return res.json();
  },

  resolveAlert: async (alertId: number): Promise<Alert> => {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, { method: 'POST' });
    if (!res.ok) throw new Error('Error al resolver alerta');
    return res.json();
  },

  // Mantenimiento
  getTickets: async (buildingId?: number): Promise<MaintenanceTicket[]> => {
    const url = buildingId ? `${API_BASE}/maintenance/tickets?building_id=${buildingId}` : `${API_BASE}/maintenance/tickets`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al obtener tickets');
    return res.json();
  },

  createTicket: async (ticket: Partial<MaintenanceTicket>): Promise<MaintenanceTicket> => {
    const res = await fetch(`${API_BASE}/maintenance/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    });
    if (!res.ok) throw new Error('Error al crear ticket');
    return res.json();
  },

  updateTicket: async (ticketId: number, data: Partial<MaintenanceTicket>): Promise<MaintenanceTicket> => {
    const res = await fetch(`${API_BASE}/maintenance/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar ticket');
    return res.json();
  },

  // Facturación
  getBillingEstimate: async (buildingId: number, days: number = 30): Promise<BillingEstimate> => {
    const res = await fetch(`${API_BASE}/billing/estimate?building_id=${buildingId}&days=${days}`);
    if (!res.ok) throw new Error('Error al calcular facturación');
    return res.json();
  },

  // Simulación interactiva
  triggerSimulatedTelemetry: async (meterId: number, powerKw: number): Promise<any> => {
    const payload = {
      readings: [
        {
          meter_id: meterId,
          timestamp: new Date().toISOString(),
          active_energy_kwh: 15420.0,
          instant_power_kw: powerKw,
          reactive_energy_kvarh: powerKw * 0.15,
          voltage_v: 231.5,
          current_a: (powerKw * 1000) / 230,
        },
      ],
    };
    const res = await fetch(`${API_BASE}/telemetry/readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error al enviar telemetría');
    return res.json();
  },
};
