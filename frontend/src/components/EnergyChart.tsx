import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { EnergyCurveResponse } from '../types';
import { BarChart3, Layers } from 'lucide-react';

interface EnergyChartProps {
  data: EnergyCurveResponse | null;
  hoursBack: number;
  onHoursChange: (hours: number) => void;
}

export const EnergyChart: React.FC<EnergyChartProps> = ({
  data,
  hoursBack,
  onHoursChange,
}) => {
  const [viewMode, setViewMode] = useState<'total' | 'stacked'>('total');

  if (!data || !data.points || data.points.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        Cargando telemetría energética...
      </div>
    );
  }

  const firstPoint = data.points[0];
  const zoneNames = Object.keys(firstPoint.zone_breakdown || {});

  const chartData = data.points.map((p) => {
    return {
      time: p.timestamp,
      total_power_kw: p.total_power_kw,
      ...p.zone_breakdown,
    };
  });

  const zoneColors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Curva de Carga y Demanda de Potencia (kW)
          </h2>
          <p className="text-xs text-slate-400">
            Monitorización continua de potencia activa según intervalos horarios
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
            <button
              onClick={() => setViewMode('total')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'total'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Potencia Total
            </button>
            <button
              onClick={() => setViewMode('stacked')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                viewMode === 'stacked'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              Por Zonas
            </button>
          </div>

          <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60 text-xs">
            <button
              onClick={() => onHoursChange(24)}
              className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                hoursBack === 24
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              24h
            </button>
            <button
              onClick={() => onHoursChange(48)}
              className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                hoursBack === 48
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              48h
            </button>
          </div>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              {zoneNames.map((name, i) => (
                <linearGradient key={name} id={`colorZone-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={zoneColors[i % zoneColors.length]} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={zoneColors[i % zoneColors.length]} stopOpacity={0.0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" kW" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: '#fff',
              }}
            />
            {viewMode === 'stacked' && <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />}

            {viewMode === 'total' ? (
              <Area
                type="monotone"
                dataKey="total_power_kw"
                name="Potencia Total"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            ) : (
              zoneNames.map((name, i) => (
                <Area
                  key={name}
                  type="monotone"
                  stackId="1"
                  dataKey={name}
                  name={name}
                  stroke={zoneColors[i % zoneColors.length]}
                  fillOpacity={1}
                  fill={`url(#colorZone-${i})`}
                />
              ))
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
