import React, { useState, useEffect } from 'react';
import { api, API_BASE } from './services/api';
import type { Building, BuildingKPISummary, EnergyCurveResponse, ZoneEnergySummary, Alert, MaintenanceTicket } from './types';
import {
  fallbackBuildings,
  fallbackSummary,
  fallbackCurve,
  fallbackZones,
  fallbackAlerts,
  fallbackTickets,
} from './services/mockData';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { EnergyChart } from './components/EnergyChart';
import { ZoneDistribution } from './components/ZoneDistribution';
import { AlertsAndMaintenance } from './components/AlertsAndMaintenance';
import { BillingModal } from './components/BillingModal';
import { Wifi, WifiOff } from 'lucide-react';

export const App: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>(fallbackBuildings);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number>(1);
  const [summary, setSummary] = useState<BuildingKPISummary | null>(fallbackSummary);
  const [energyCurve, setEnergyCurve] = useState<EnergyCurveResponse | null>(fallbackCurve);
  const [zones, setZones] = useState<ZoneEnergySummary[]>(fallbackZones);
  const [alerts, setAlerts] = useState<Alert[]>(fallbackAlerts);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(fallbackTickets);
  const [hoursBack, setHoursBack] = useState<number>(24);
  const [isBillingOpen, setIsBillingOpen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      loadBuildingData(selectedBuildingId, hoursBack);
    }
  }, [selectedBuildingId, hoursBack]);

  const loadInitialData = async () => {
    try {
      const bList = await api.getBuildings();
      if (bList && bList.length > 0) {
        setBuildings(bList);
        setSelectedBuildingId(bList[0].id);
        setIsLiveConnected(true);
        await loadBuildingData(bList[0].id, hoursBack);
      }
    } catch (err) {
      console.warn('API no accesible inmediatamente (posible cold start de Render), usando datos de contingencia:', err);
      setIsLiveConnected(false);
    }
  };

  const loadBuildingData = async (buildingId: number, hours: number) => {
    try {
      const [sum, curve, zList, aList, tList] = await Promise.all([
        api.getBuildingSummary(buildingId),
        api.getEnergyCurve(buildingId, hours),
        api.getZones(buildingId),
        api.getAlerts(buildingId),
        api.getTickets(buildingId),
      ]);
      setSummary(sum);
      setEnergyCurve(curve);
      setZones(zList);
      setAlerts(aList);
      setTickets(tList);
      setIsLiveConnected(true);
    } catch (err) {
      console.warn('Usando datos de contingencia para edificio:', buildingId);
      setIsLiveConnected(false);
    }
  };

  const handleRefresh = () => {
    loadBuildingData(selectedBuildingId, hoursBack);
  };

  const handleInjectSpike = async () => {
    setIsSimulating(true);
    try {
      const res = await api.triggerSimulatedTelemetry(1, 76.8);
      setNotification(`⚡ Pico de 76.8 kW inyectado en Chiller A. ${res.message}`);
      setTimeout(() => {
        handleRefresh();
        setIsSimulating(false);
      }, 800);
      setTimeout(() => {
        setNotification(null);
      }, 6000);
    } catch (err) {
      // Simular alerta localmente si el backend no responde
      setNotification('⚡ [Modo Demo] Pico de 76.8 kW registrado. Alerta de sobrecarga generada.');
      setAlerts((prev) => [
        {
          id: Date.now(),
          building_id: selectedBuildingId,
          meter_id: 1,
          meter_name: 'Enfriadora Chiller A (HVAC)',
          severity: 'CRITICAL',
          title: 'Sobrecarga Crítica en Enfriadora Chiller A',
          description: 'Potencia registrada de 76.80 kW (96% de la capacidad nominal de 80.0 kW).',
          trigger_value: 76.8,
          threshold_value: 72.0,
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      if (summary) {
        setSummary({
          ...summary,
          current_power_kw: 135.2,
          power_load_percentage: 75.1,
          active_alerts_count: summary.active_alerts_count + 1,
        });
      }
      setIsSimulating(false);
      setTimeout(() => setNotification(null), 6000);
    }
  };

  const handleAcknowledgeAlert = async (id: number) => {
    try {
      await api.acknowledgeAlert(id);
    } catch {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a)));
    }
    handleRefresh();
  };

  const handleResolveAlert = async (id: number) => {
    try {
      await api.resolveAlert(id);
    } catch {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED', resolved_at: new Date().toISOString() } : a)));
    }
    handleRefresh();
  };

  const handleCreateTicket = async (ticketData: any) => {
    try {
      await api.createTicket(ticketData);
    } catch {
      setTickets((prev) => [
        {
          id: Date.now(),
          ...ticketData,
          status: 'OPEN',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    handleRefresh();
  };

  const handleUpdateTicketStatus = async (id: number, status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      await api.updateTicket(id, { status });
    } catch {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    }
    handleRefresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <Header
        buildings={buildings}
        selectedBuildingId={selectedBuildingId}
        onSelectBuilding={setSelectedBuildingId}
        onRefresh={handleRefresh}
        onInjectSpike={handleInjectSpike}
        isSimulating={isSimulating}
      />

      {/* Connection Status Banner */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-6 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLiveConnected ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Wifi className="w-3.5 h-3.5" />
              API en Vivo Conectada ({API_BASE})
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <WifiOff className="w-3.5 h-3.5 animate-pulse" />
              Despertando Backend Render (~30s si estaba en reposo). Mostrando datos interactivos de demostración.
            </span>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="text-slate-400 hover:text-white underline text-[11px]"
        >
          Reintentar sincronización
        </button>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500/20 border border-amber-500/40 text-amber-200 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md text-xs flex items-center gap-3">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-amber-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        <MetricCards summary={summary} onOpenBilling={() => setIsBillingOpen(true)} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EnergyChart data={energyCurve} hoursBack={hoursBack} onHoursChange={setHoursBack} />
          </div>
          <div>
            <ZoneDistribution zones={zones} />
          </div>
        </div>

        <AlertsAndMaintenance
          alerts={alerts}
          tickets={tickets}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onResolveAlert={handleResolveAlert}
          onCreateTicket={handleCreateTicket}
          onUpdateTicketStatus={handleUpdateTicketStatus}
          buildingId={selectedBuildingId}
        />
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        SyncroHub Smart Building Platform • Demostración técnica Full Stack (FastAPI + SQLModel + React + Recharts + Docker)
      </footer>

      <BillingModal
        buildingId={selectedBuildingId}
        isOpen={isBillingOpen}
        onClose={() => setIsBillingOpen(false)}
      />
    </div>
  );
};

export default App;
