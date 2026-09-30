import type {
  Building,
  BuildingKPISummary,
  EnergyCurveResponse,
  ZoneEnergySummary,
  Alert,
  MaintenanceTicket,
  BillingEstimate,
} from '../types';

export const fallbackBuildings: Building[] = [
  {
    id: 1,
    name: 'Torre Castellana - Sede SyncroHub',
    code: 'BLD-MAD-01',
    address: 'Paseo de la Castellana 180',
    city: 'Madrid',
    total_area_m2: 8400,
    contracted_power_kw: 180,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Campus Tecnológico 22@',
    code: 'BLD-BCN-02',
    address: 'Carrer de Sancho de Ávila 65',
    city: 'Barcelona',
    total_area_m2: 4200,
    contracted_power_kw: 95,
    created_at: new Date().toISOString(),
  },
];

export const fallbackSummary: BuildingKPISummary = {
  building_id: 1,
  building_name: 'Torre Castellana - Sede SyncroHub',
  current_power_kw: 114.5,
  contracted_power_kw: 180.0,
  power_load_percentage: 63.6,
  energy_today_kwh: 1420.5,
  energy_yesterday_kwh: 1485.0,
  variation_percentage: -4.3,
  cost_today_eur: 227.28,
  active_alerts_count: 2,
  open_tickets_count: 1,
  co2_today_kg: 355.1,
};

export const fallbackCurve: EnergyCurveResponse = {
  building_id: 1,
  interval: 'hour',
  points: [
    { timestamp: '00:00', total_power_kw: 38.2, energy_kwh: 38.2, zone_breakdown: { 'Data Center': 28, Climatización: 5, Oficinas: 3, Iluminación: 2.2 } },
    { timestamp: '02:00', total_power_kw: 36.5, energy_kwh: 36.5, zone_breakdown: { 'Data Center': 28, Climatización: 4, Oficinas: 2.5, Iluminación: 2 } },
    { timestamp: '04:00', total_power_kw: 35.8, energy_kwh: 35.8, zone_breakdown: { 'Data Center': 27.5, Climatización: 4.5, Oficinas: 2, Iluminación: 1.8 } },
    { timestamp: '06:00', total_power_kw: 52.4, energy_kwh: 52.4, zone_breakdown: { 'Data Center': 28, Climatización: 14, Oficinas: 5, Iluminación: 5.4 } },
    { timestamp: '08:00', total_power_kw: 94.6, energy_kwh: 94.6, zone_breakdown: { 'Data Center': 29, Climatización: 35, Oficinas: 18, Iluminación: 12.6 } },
    { timestamp: '10:00', total_power_kw: 128.2, energy_kwh: 128.2, zone_breakdown: { 'Data Center': 31, Climatización: 52, Oficinas: 28, Iluminación: 17.2 } },
    { timestamp: '12:00', total_power_kw: 142.5, energy_kwh: 142.5, zone_breakdown: { 'Data Center': 32, Climatización: 60, Oficinas: 32, Iluminación: 18.5 } },
    { timestamp: '14:00', total_power_kw: 135.0, energy_kwh: 135.0, zone_breakdown: { 'Data Center': 31, Climatización: 55, Oficinas: 31, Iluminación: 18 } },
    { timestamp: '16:00', total_power_kw: 130.8, energy_kwh: 130.8, zone_breakdown: { 'Data Center': 31, Climatización: 54, Oficinas: 28, Iluminación: 17.8 } },
    { timestamp: '18:00', total_power_kw: 112.4, energy_kwh: 112.4, zone_breakdown: { 'Data Center': 30, Climatización: 44, Oficinas: 24, Iluminación: 14.4 } },
    { timestamp: '20:00', total_power_kw: 68.2, energy_kwh: 68.2, zone_breakdown: { 'Data Center': 29, Climatización: 22, Oficinas: 10, Iluminación: 7.2 } },
    { timestamp: '22:00', total_power_kw: 42.1, energy_kwh: 42.1, zone_breakdown: { 'Data Center': 28.5, Climatización: 7.5, Oficinas: 4, Iluminación: 2.1 } },
  ],
};

export const fallbackZones: ZoneEnergySummary[] = [
  { zone_id: 1, name: 'Sala Técnica HVAC & Climatización', zone_type: 'HVAC', floor: -1, area_m2: 450, current_power_kw: 52.3, total_energy_kwh: 624.0, percentage_of_total: 44.0 },
  { zone_id: 2, name: 'Data Center & Servidores Centrales', zone_type: 'IT_EQUIPMENT', floor: -1, area_m2: 180, current_power_kw: 31.8, total_energy_kwh: 445.0, percentage_of_total: 31.3 },
  { zone_id: 3, name: 'Plantas 1-3: Oficinas y Puestos Operativos', zone_type: 'GENERAL', floor: 1, area_m2: 3600, current_power_kw: 21.4, total_energy_kwh: 245.5, percentage_of_total: 17.3 },
  { zone_id: 4, name: 'Alumbrado General y Zonas Comunes', zone_type: 'LIGHTING', floor: 0, area_m2: 1200, current_power_kw: 9.0, total_energy_kwh: 106.0, percentage_of_total: 7.4 },
];

export const fallbackAlerts: Alert[] = [
  {
    id: 1,
    building_id: 1,
    meter_id: 1,
    meter_name: 'Enfriadora Chiller A (HVAC)',
    severity: 'WARNING',
    title: 'Pico de potencia cercano al límite en Enfriadora Chiller A',
    description: 'Potencia instantánea alcanzó 73.5 kW (92% de la capacidad nominal de 80.0 kW).',
    trigger_value: 73.5,
    threshold_value: 72.0,
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 2,
    building_id: 1,
    meter_id: 3,
    meter_name: 'Subcontador Planta 1-3 (Oficinas)',
    severity: 'INFO',
    title: 'Consumo residual fuera de horario en Planta 1',
    description: 'Consumo nocturno continuo superior a 5 kW detectado entre las 02:00 y las 05:00.',
    trigger_value: 5.8,
    threshold_value: 3.0,
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

export const fallbackTickets: MaintenanceTicket[] = [
  {
    id: 1,
    building_id: 1,
    alert_id: 1,
    title: 'Revisión preventiva de compresor Chiller A',
    description: 'Verificar presiones de gas refrigerante y amperaje tras registrar picos superiores al 90%.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assigned_to: 'Carlos Sánchez (Técnico Climatización)',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const fallbackBilling: BillingEstimate = {
  building_id: 1,
  building_name: 'Torre Castellana - Sede SyncroHub',
  period_start: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0],
  period_end: new Date().toISOString().split('T')[0],
  total_kwh: 42680.0,
  breakdown: [
    { period: 'PUNTA', kwh: 15364.8, rate_eur_per_kwh: 0.24, cost_eur: 3687.55, percentage_of_energy: 36.0 },
    { period: 'LLANO', kwh: 17925.6, rate_eur_per_kwh: 0.16, cost_eur: 2868.10, percentage_of_energy: 42.0 },
    { period: 'VALLE', kwh: 9389.6, rate_eur_per_kwh: 0.10, cost_eur: 938.96, percentage_of_energy: 22.0 },
  ],
  energy_cost_eur: 7494.61,
  power_term_eur: 594.0,
  taxes_eur: 2154.5,
  total_invoice_eur: 10243.11,
  co2_kg_emitted: 10670.0,
  tree_offset_equivalent: 485,
};
