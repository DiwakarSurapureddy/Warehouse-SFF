import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, CheckCircle2, AlertTriangle, Scale, Maximize2,
  Package, ArrowRight, ShieldCheck, RefreshCw, Printer
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { packingApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const BOX_OPTIONS = [
  { code: 'Box-S', name: 'Box-S (Small Electronics / 20x15x10cm)', maxWeight: '3kg' },
  { code: 'Box-M', name: 'Box-M (Standard Cardboard / 30x20x15cm)', maxWeight: '8kg' },
  { code: 'Box-L', name: 'Box-L (Heavy Reinforced / 50x40x35cm)', maxWeight: '25kg' },
  { code: 'Box-XL', name: 'Box-XL (Industrial Palletized / 80x60x50cm)', maxWeight: '50kg' },
];

const PackingWorkspace = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedBox, setSelectedBox] = useState('Box-M (Standard Cardboard)');
  const [actualWeight, setActualWeight] = useState(2.8);
  const [packingNotes, setPackingNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await packingApi.getTasks();
      setTasks(res.tasks || []);
      if (res.tasks && res.tasks.length > 0 && !selectedTask) {
        const detail = await packingApi.getTask(res.tasks[0].id);
        setSelectedTask(detail.task);
        setSelectedBox(detail.task.recommended_box_type || 'Box-M');
        setActualWeight(detail.task.actual_weight_kg || 2.8);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSelectTask = async (taskId) => {
    try {
      const res = await packingApi.getTask(taskId);
      setSelectedTask(res.task);
      setSelectedBox(res.task.recommended_box_type || 'Box-M');
      setActualWeight(res.task.actual_weight_kg || 2.8);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleStartPacking = async () => {
    if (!selectedTask) return;
    try {
      const res = await packingApi.startPacking(selectedTask.id);
      setSelectedTask(res.task);
      addToast('Packing task initiated', 'info');
      fetchTasks();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCompletePacking = async () => {
    if (!selectedTask) return;
    setCompleting(true);
    try {
      await packingApi.completePacking(selectedTask.id, {
        box_type: selectedBox,
        weight_kg: actualWeight,
        notes: packingNotes,
      });
      addToast(`Order #${selectedTask.order_number} packed and routed to Quality Check!`, 'success');
      fetchTasks();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-brand-500/40 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center shadow-glow-indigo text-blue-300">
            <Box className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Packing Station 03
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 uppercase font-mono">
                Active Station
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Volumetric carton size recommendation, weight calibration, and parcel label generation.
            </p>
          </div>
        </div>

        <button
          onClick={fetchTasks}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Queue */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Orders Waiting to Pack ({tasks.length})
          </h3>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {tasks.map((t) => {
              const isSelected = selectedTask?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTask(t.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500/60 shadow-glow-indigo'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-white">{t.order_number}</span>
                    <StatusBadge status={t.status} size="sm" />
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5 font-mono">
                    Rec Box: <strong className="text-slate-200">{t.recommended_box_type}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Packing Workspace Interface */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 lg:col-span-2 space-y-6">
          {selectedTask ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-white">
                      Parcel Packing: {selectedTask.order_number}
                    </span>
                    <StatusBadge status={selectedTask.status} />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Operator: <strong className="text-brand-300">{selectedTask.assigned_user_name}</strong>
                  </p>
                </div>

                {selectedTask.status === 'WAITING' && (
                  <button
                    onClick={handleStartPacking}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-glow-indigo"
                  >
                    Start Packing Session
                  </button>
                )}
              </div>

              {/* Picked Items to Box */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  Verified Picked Items
                </h4>
                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/80 divide-y divide-slate-800/60 text-xs">
                  {selectedTask.order_items?.map((it) => (
                    <div key={it.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-brand-300">{it.sku}</div>
                        <div className="text-slate-200">{it.name}</div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-emerald-400 font-bold text-sm">{it.quantity_picked}</span>
                        <span className="text-slate-400"> / {it.quantity_requested} units</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Packaging Specification Form */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 text-xs">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider">
                  Packaging & Container Calibration
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1.5">
                      Selected Carton Box Type
                    </label>
                    <select
                      value={selectedBox}
                      onChange={(e) => setSelectedBox(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-brand-500"
                    >
                      {BOX_OPTIONS.map((b) => (
                        <option key={b.code} value={b.name}>
                          {b.name} (Max {b.maxWeight})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1.5 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-brand-400" />
                      <span>Calibrated Scale Weight (kg)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={actualWeight}
                      onChange={(e) => setActualWeight(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">
                    Packing Notes / Protective Inserts Used
                  </label>
                  <input
                    type="text"
                    value={packingNotes}
                    onChange={(e) => setPackingNotes(e.target.value)}
                    placeholder="Reinforced edge corners, anti-static bubble wrap applied..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              {/* Complete Packing Action */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => addToast('Shipping barcode label sent to zebra thermal printer', 'info')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Carrier Routing Label</span>
                </button>

                <button
                  onClick={handleCompletePacking}
                  disabled={completing}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-glow-indigo transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{completing ? 'Sealing Parcel...' : 'Complete & Send to QC Inspection'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select an order from the left queue to begin packing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackingWorkspace;
