import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import type { Building, BuildingKPISummary, EnergyCurveResponse, ZoneEnergySummary, Alert, MaintenanceTicket } from './types';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { EnergyChart } from './components/EnergyChart';
import { ZoneDistribution } from './components/ZoneDistribution';
import { AlertsAndMaintenance } from './components/AlertsAndMaintenance';
import { BillingModal } from './components/BillingModal';

export const App: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number>(1);
  const [summary, setSummary] = useState<BuildingKPISummary | null>(null);
  const [energyCurve, setEnergyCurve] = useState<EnergyCurveResponse | null>(null);
  const [zones, setZones] = useState<ZoneEnergySummary[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [hoursBack, setHoursBack] = useState<number>(24);
  const [isBillingOpen, setIsBillingOpen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
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
      setBuildings(bList);
      if (bList.length > 0) {
        setSelectedBuildingId(bList[0].id);
        await loadBuildingData(bList[0].id, hoursBack);
      }
    } catch (err) {
      console.error('Error al inicializar datos:', err);
    } finally {
      setLoading(false);
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
    } catch (err) {
      console.error('Error cargando edificio:', err);
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
      console.error(err);
      setIsSimulating(false);
    }
  };

  const handleAcknowledgeAlert = async (id: number) => {
    await api.acknowledgeAlert(id);
    handleRefresh();
  };

  const handleResolveAlert = async (id: number) => {
    await api.resolveAlert(id);
    handleRefresh();
  };

  const handleCreateTicket = async (ticketData: any) => {
    await api.createTicket(ticketData);
    handleRefresh();
  };

  const handleUpdateTicketStatus = async (id: number, status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED') => {
    await api.updateTicket(id, { status });
    handleRefresh();
  };

  if (loading && buildings.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Conectando con plataforma SyncroHub...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header
        buildings={buildings}
        selectedBuildingId={selectedBuildingId}
        onSelectBuilding={setSelectedBuildingId}
        onRefresh={handleRefresh}
        onInjectSpike={handleInjectSpike}
        isSimulating={isSimulating}
      />

      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-500/20 border border-amber-500/40 text-amber-200 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md text-xs flex items-center gap-3">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-amber-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

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
