export interface Building {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  total_area_m2: number;
  contracted_power_kw: number;
  target_kwh_per_year?: number;
  created_at: string;
}

export interface BuildingKPISummary {
  building_id: number;
  building_name: string;
  current_power_kw: number;
  contracted_power_kw: number;
  power_load_percentage: number;
  energy_today_kwh: number;
  energy_yesterday_kwh: number;
  variation_percentage: number;
  cost_today_eur: number;
  active_alerts_count: number;
  open_tickets_count: number;
  co2_today_kg: number;
}

export interface EnergyPoint {
  timestamp: string;
  total_power_kw: number;
  energy_kwh: number;
  zone_breakdown: Record<string, number>;
}

export interface EnergyCurveResponse {
  building_id: number;
  interval: string;
  points: EnergyPoint[];
}

export interface ZoneEnergySummary {
  zone_id: number;
  name: string;
  zone_type: string;
  floor: number;
  area_m2: number;
  current_power_kw: number;
  total_energy_kwh: number;
  percentage_of_total: number;
}

export interface Meter {
  id: number;
  serial_number: string;
  name: string;
  meter_type: string;
  unit: string;
  max_rated_power_kw: number;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';
  zone_id: number;
  last_seen_at?: string;
  created_at: string;
}

export interface Alert {
  id: number;
  building_id: number;
  meter_id: number;
  meter_name?: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  trigger_value: number;
  threshold_value: number;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  created_at: string;
  resolved_at?: string;
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
  resolved_at?: string;
}

export interface TariffBreakdown {
  period: string;
  kwh: number;
  rate_eur_per_kwh: number;
  cost_eur: number;
  percentage_of_energy: number;
}

export interface BillingEstimate {
  building_id: number;
  building_name: string;
  period_start: string;
  period_end: string;
  total_kwh: number;
  breakdown: TariffBreakdown[];
  energy_cost_eur: number;
  power_term_eur: number;
  taxes_eur: number;
  total_invoice_eur: number;
  co2_kg_emitted: number;
  tree_offset_equivalent: number;
}
