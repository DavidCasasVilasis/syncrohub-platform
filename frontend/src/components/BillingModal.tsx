import React, { useState, useEffect } from 'react';
import type { BillingEstimate } from '../types';
import { api } from '../services/api';
import { X, Receipt, Leaf } from 'lucide-react';

interface BillingModalProps {
  buildingId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const BillingModal: React.FC<BillingModalProps> = ({ buildingId, isOpen, onClose }) => {
  const [estimate, setEstimate] = useState<BillingEstimate | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBilling();
    }
  }, [isOpen, buildingId, days]);

  const loadBilling = async () => {
    setLoading(true);
    try {
      const data = await api.getBillingEstimate(buildingId, days);
      setEstimate(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Simulador de Facturación Eléctrica</h3>
              <p className="text-xs text-slate-400">
                Cálculo estimado conforme a tarifas horarias 3.0TD y término de potencia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex items-center justify-between mb-4 bg-slate-800/50 p-2.5 rounded-xl">
          <span className="text-xs text-slate-300 font-medium">Periodo de facturación a simular:</span>
          <div className="flex gap-1.5">
            {[7, 15, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  days === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {d} días
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading || !estimate ? (
          <div className="py-12 text-center text-slate-400 text-sm">Calculando tarifas y tramos horarios...</div>
        ) : (
          <div className="space-y-5 overflow-y-auto pr-1">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Desglose por Periodos Horarios
              </h4>
              <div className="bg-slate-800/40 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/60">
                    <tr>
                      <th className="p-3">Periodo</th>
                      <th className="p-3">Energía (kWh)</th>
                      <th className="p-3">Tarifa (€/kWh)</th>
                      <th className="p-3">Total Tramo</th>
                      <th className="p-3">% Consumo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {estimate.breakdown.map((b) => (
                      <tr key={b.period} className="hover:bg-slate-800/20">
                        <td className="p-3 font-bold text-white flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              b.period === 'PUNTA'
                                ? 'bg-rose-500'
                                : b.period === 'LLANO'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          {b.period}
                        </td>
                        <td className="p-3">{b.kwh.toLocaleString()} kWh</td>
                        <td className="p-3">{b.rate_eur_per_kwh.toFixed(2)} €</td>
                        <td className="p-3 font-semibold text-white">{b.cost_eur.toFixed(2)} €</td>
                        <td className="p-3">{b.percentage_of_energy}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/30 p-4 rounded-xl border border-slate-800">
              <div className="space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Término de energía:</span>
                  <span className="font-semibold text-slate-200">{estimate.energy_cost_eur.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span>Término fijo de potencia:</span>
                  <span className="font-semibold text-slate-200">{estimate.power_term_eur.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span>Impuestos (Eléctrico + IVA):</span>
                  <span className="font-semibold text-slate-200">{estimate.taxes_eur.toFixed(2)} €</span>
                </div>
              </div>

              <div className="flex flex-col justify-center items-end border-l border-slate-800 pl-4">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Estimado</span>
                <span className="text-2xl font-bold text-emerald-400">{estimate.total_invoice_eur.toFixed(2)} €</span>
                <span className="text-[10px] text-slate-500">Estimación {days} días</span>
              </div>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">Impacto Medioambiental y Huella de Carbono</h5>
                  <p className="text-[11px] text-slate-400">
                    Emisión de {estimate.co2_kg_emitted.toLocaleString()} kg de CO₂ en el periodo
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-emerald-300">~{estimate.tree_offset_equivalent} árboles</span>
                <p className="text-[10px] text-slate-400">necesarios para absorción anual</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
