import React from 'react';
import { Gauge, TrendingUp, TrendingDown, DollarSign, AlertCircle, Wrench, Leaf } from 'lucide-react';
import type { BuildingKPISummary } from '../types';

interface MetricCardsProps {
  summary: BuildingKPISummary | null;
  onOpenBilling: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ summary, onOpenBilling }) => {
  if (!summary) return null;

  const isHighLoad = summary.power_load_percentage >= 85;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Potencia Actual</span>
          <div className={`p-2 rounded-xl ${isHighLoad ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
            <Gauge className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold tracking-tight text-white">{summary.current_power_kw}</span>
          <span className="text-sm font-medium text-slate-400">kW</span>
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Carga contratada ({summary.contracted_power_kw} kW)</span>
            <span className={`font-semibold ${isHighLoad ? 'text-red-400' : 'text-slate-300'}`}>
              {summary.power_load_percentage}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isHighLoad ? 'bg-red-500' : summary.power_load_percentage > 70 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, summary.power_load_percentage)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Consumo Hoy</span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            {summary.variation_percentage >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold tracking-tight text-white">{summary.energy_today_kwh.toLocaleString()}</span>
          <span className="text-sm font-medium text-slate-400">kWh</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold px-1.5 py-0.5 rounded ${
              summary.variation_percentage <= 0
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            {summary.variation_percentage > 0 ? `+${summary.variation_percentage}%` : `${summary.variation_percentage}%`}
          </span>
          <span className="text-slate-400">vs ayer mismo periodo</span>
        </div>
      </div>

      <div
        onClick={onOpenBilling}
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-blue-500/50 cursor-pointer group transition-all"
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-blue-400 transition-colors">
            Coste Estimado Hoy
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold tracking-tight text-white">{summary.cost_today_eur.toFixed(2)}</span>
          <span className="text-sm font-medium text-slate-400">€</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          <span>{summary.co2_today_kg.toFixed(1)} kg CO₂ emitidos</span>
          <span className="ml-auto text-blue-400 underline font-medium">Ver desglose</span>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Estado Técnico</span>
          <div className="flex gap-1.5">
            <div className={`p-2 rounded-xl ${summary.active_alerts_count > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="flex items-baseline gap-3 mb-2">
          <div>
            <span className="text-3xl font-bold tracking-tight text-white">{summary.active_alerts_count}</span>
            <span className="text-xs text-slate-400 ml-1">alertas</span>
          </div>
          <span className="text-slate-600">|</span>
          <div>
            <span className="text-3xl font-bold tracking-tight text-blue-400">{summary.open_tickets_count}</span>
            <span className="text-xs text-slate-400 ml-1">tickets</span>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          {summary.active_alerts_count > 0 ? (
            <span className="text-amber-400 font-medium">Requiere atención en climatización/redes</span>
          ) : (
            <span className="text-emerald-400 font-medium">Todos los subsistemas en rango nominal</span>
          )}
        </div>
      </div>
    </div>
  );
};
