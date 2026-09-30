import React, { useState } from 'react';
import type { Alert, MaintenanceTicket } from '../types';
import { CheckCircle, Plus, Wrench, ShieldAlert, Check } from 'lucide-react';

interface AlertsAndMaintenanceProps {
  alerts: Alert[];
  tickets: MaintenanceTicket[];
  onAcknowledgeAlert: (id: number) => void;
  onResolveAlert: (id: number) => void;
  onCreateTicket: (ticket: {
    building_id: number;
    alert_id?: number;
    title: string;
    description: string;
    priority: string;
    assigned_to: string;
  }) => void;
  onUpdateTicketStatus: (id: number, status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED') => void;
  buildingId: number;
}

export const AlertsAndMaintenance: React.FC<AlertsAndMaintenanceProps> = ({
  alerts,
  tickets,
  onAcknowledgeAlert,
  onResolveAlert,
  onCreateTicket,
  onUpdateTicketStatus,
  buildingId,
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'tickets'>('alerts');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newAssignee, setNewAssignee] = useState('Equipo Mantenimiento Climatización');
  const [selectedAlertId, setSelectedAlertId] = useState<number | undefined>(undefined);

  const handleOpenTicketFromAlert = (alert: Alert) => {
    setSelectedAlertId(alert.id);
    setNewTitle(`Revisión correctiva: ${alert.title}`);
    setNewDesc(`Incidencia derivada de alerta IoT: ${alert.description}`);
    setNewPriority(alert.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM');
    setShowNewTicketModal(true);
    setActiveTab('tickets');
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    onCreateTicket({
      building_id: buildingId,
      alert_id: selectedAlertId,
      title: newTitle,
      description: newDesc,
      priority: newPriority,
      assigned_to: newAssignee,
    });
    setNewTitle('');
    setNewDesc('');
    setSelectedAlertId(undefined);
    setShowNewTicketModal(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'alerts'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Alertas IoT ({alerts.filter((a) => a.status === 'ACTIVE').length})
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'tickets'
                ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Tickets de Mantenimiento ({tickets.filter((t) => t.status !== 'COMPLETED').length})
          </button>
        </div>

        {activeTab === 'tickets' && (
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Ticket
          </button>
        )}
      </div>

      {/* ALERTS TAB */}
      {activeTab === 'alerts' && (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No hay alertas registradas en este edificio.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-red-500/5 border-red-500/30'
                    : alert.severity === 'WARNING'
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-blue-500/5 border-blue-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400'
                          : alert.severity === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {alert.meter_name || `Contador #${alert.meter_id}`}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-3">{alert.description}</p>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60">
                  <span className="text-slate-400">
                    Registrado: {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div className="flex items-center gap-2">
                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                      >
                        Reconocer
                      </button>
                    )}
                    {alert.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleOpenTicketFromAlert(alert)}
                        className="px-2 py-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded transition-colors"
                      >
                        Crear Ticket Mto.
                      </button>
                    )}
                    {alert.status !== 'RESOLVED' && (
                      <button
                        onClick={() => onResolveAlert(alert.id)}
                        className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded"
                        title="Marcar como resuelta"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {alert.status === 'RESOLVED' && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Resuelta
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TICKETS TAB */}
      {activeTab === 'tickets' && (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No hay órdenes de mantenimiento activas.
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ticket.priority === 'URGENT' || ticket.priority === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                      <h4 className="text-xs font-bold text-white">{ticket.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{ticket.description}</p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      ticket.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : ticket.status === 'IN_PROGRESS'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {ticket.status === 'COMPLETED'
                      ? 'COMPLETADA'
                      : ticket.status === 'IN_PROGRESS'
                      ? 'EN PROCESO'
                      : 'PENDIENTE'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800 text-slate-400">
                  <span>Asignado: {ticket.assigned_to}</span>

                  <div className="flex items-center gap-1.5">
                    {ticket.status === 'OPEN' && (
                      <button
                        onClick={() => onUpdateTicketStatus(ticket.id, 'IN_PROGRESS')}
                        className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 hover:bg-blue-600/50"
                      >
                        Iniciar trabajo
                      </button>
                    )}
                    {ticket.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => onUpdateTicketStatus(ticket.id, 'COMPLETED')}
                        className="px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50"
                      >
                        Marcar Resuelta
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal para crear Ticket */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Nueva Orden de Mantenimiento</h3>
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título de la incidencia</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Revisión filtros climatizadora RoofTop"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción y detalles</label>
                <textarea
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detalles técnicos, mediciones o instrucciones para el equipo técnico..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prioridad</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                  >
                    <option value="LOW">Baja (LOW)</option>
                    <option value="MEDIUM">Media (MEDIUM)</option>
                    <option value="HIGH">Alta (HIGH)</option>
                    <option value="URGENT">Urgente (URGENT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Asignado a</label>
                  <input
                    type="text"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors"
                >
                  Registrar Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
