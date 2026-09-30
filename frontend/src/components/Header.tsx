import React from 'react';
import { Building as BuildingIcon, Activity, ExternalLink, Zap, RefreshCw } from 'lucide-react';
import type { Building } from '../types';

interface HeaderProps {
  buildings: Building[];
  selectedBuildingId: number;
  onSelectBuilding: (id: number) => void;
  onRefresh: () => void;
  onInjectSpike: () => void;
  isSimulating: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  onRefresh,
  onInjectSpike,
  isSimulating,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-white">SyncroHub</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20">
                Smart BMS
              </span>
            </div>
            <p className="text-xs text-slate-400">Plataforma de Gestión Inteligente y Monitorización Energética</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <BuildingIcon className="w-4 h-4 text-blue-400" />
            <select
              className="bg-transparent text-sm text-slate-200 font-medium focus:outline-none cursor-pointer"
              value={selectedBuildingId}
              onChange={(e) => onSelectBuilding(Number(e.target.value))}
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-800 text-slate-200">
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onInjectSpike}
            disabled={isSimulating}
            title="Simula un pico de potencia del 95% para disparar el motor de anomalías"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all disabled:opacity-50"
          >
            <Activity className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Inyectando...' : 'Test: Inyectar Pico IoT'}
          </button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60 transition-colors"
            title="Recargar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 hover:bg-slate-700 transition-colors"
          >
            <span>Swagger API</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </header>
  );
};
