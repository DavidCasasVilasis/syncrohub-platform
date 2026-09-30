import React from 'react';
import type { ZoneEnergySummary } from '../types';
import { Server, Wind, Lightbulb, Building2 } from 'lucide-react';

interface ZoneDistributionProps {
  zones: ZoneEnergySummary[];
}

export const ZoneDistribution: React.FC<ZoneDistributionProps> = ({ zones }) => {
  const getZoneIcon = (type: string) => {
    switch (type) {
      case 'HVAC':
        return <Wind className="w-4 h-4 text-cyan-400" />;
      case 'IT_EQUIPMENT':
        return <Server className="w-4 h-4 text-purple-400" />;
      case 'LIGHTING':
        return <Lightbulb className="w-4 h-4 text-amber-400" />;
      default:
        return <Building2 className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">Distribución por Zonas</h3>
          <p className="text-xs text-slate-400">Consumo y potencia instantánea según área funcional</p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-300">
          {zones.length} Zonas registradas
        </span>
      </div>

      <div className="space-y-4">
        {zones.map((zone) => (
          <div key={zone.zone_id} className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/60">
                  {getZoneIcon(zone.zone_type)}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">{zone.name}</h4>
                  <span className="text-[11px] text-slate-400">
                    Planta {zone.floor} • {zone.area_m2} m²
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-white">{zone.current_power_kw} kW</span>
                <p className="text-[11px] text-slate-400">{zone.percentage_of_total}% del total</p>
              </div>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, zone.percentage_of_total)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
