import React, { useState, useEffect } from 'react';
import {
  Navigation, CheckCircle2, AlertTriangle, Play, Pause,
  Box, MapPin, ArrowRight, ShieldAlert, Sparkles, RefreshCw, Barcode
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { pickingApi, orderApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PickingWorkspace = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await pickingApi.getTasks();
      setTasks(res.tasks || []);
      if (res.tasks && res.tasks.length > 0 && !selectedTask) {
        // Load first task detail
        const taskDetail = await pickingApi.getTask(res.tasks[0].id);
        setSelectedTask(taskDetail.task);
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
      const res = await pickingApi.getTask(taskId);
      setSelectedTask(res.task);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleStepAction = async (stepNumber, actionType) => {
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      const res = await pickingApi.recordAction(selectedTask.id, {
        step_number: stepNumber,
        action_type: actionType,
        user_id: user?.id,
      });
      setSelectedTask(res.task);
      addToast(`Action recorded: Step #${stepNumber} marked as ${actionType}`, actionType === 'PICK' ? 'success' : 'warning');
      fetchTasks();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const routeSteps = selectedTask?.route_sequence || [];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-brand-500/40 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center shadow-glow-cyan text-cyan-300">
            <Navigation className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Smart Picking Workspace
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase font-mono">
                TSP Heuristic Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Shortest traversal sequence, live barcode scan validation, and instant missing item exception spawning.
            </p>
          </div>
        </div>

        <button
          onClick={fetchTasks}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Tasks</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Picking Tasks Queue */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Picking Tasks Queue ({tasks.length})
            </h3>
            <span className="text-xs text-slate-500 font-mono">Priority Sequenced</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {tasks.map((t) => {
              const isSelected = selectedTask?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTask(t.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-glow-cyan'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-white">{t.order_number}</span>
                    <PriorityBadge priority={t.priority} />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {t.picked_items} / {t.total_items} items picked
                    </span>
                    <span className="font-mono font-bold text-cyan-400">{t.completion_pct}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${t.completion_pct}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 font-mono">
                    <span>~{t.estimated_distance_m}m walk</span>
                    <span>~{t.estimated_time_min}m duration</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Step-by-Step Route Execution */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 lg:col-span-2 space-y-6">
          {selectedTask ? (
            <>
              {/* Route Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-white">
                      Route for {selectedTask.order_number}
                    </span>
                    <StatusBadge status={selectedTask.status} />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Assigned Picker: <strong className="text-brand-300">{selectedTask.assigned_user_name}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-center p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Walking Dist</span>
                    <span className="text-white font-bold">{selectedTask.estimated_distance_m} m</span>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase">Est Time</span>
                    <span className="text-white font-bold">{selectedTask.estimated_time_min} min</span>
                  </div>
                </div>
              </div>

              {/* Step Sequence Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Optimized Waypoint Sequence
                </h4>

                <div className="space-y-3">
                  {routeSteps.map((step) => {
                    const isPicked = step.status === 'PICKED';
                    const isMissing = step.status === 'MISSING';
                    const isDamaged = step.status === 'DAMAGED';

                    return (
                      <div
                        key={step.step_number}
                        className={`p-4 rounded-2xl border transition-all ${
                          isPicked
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-100'
                            : isMissing || isDamaged
                            ? 'bg-rose-950/20 border-rose-800/40 text-rose-100'
                            : 'bg-slate-950/70 border-slate-800 hover:border-brand-500/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Waypoint Info */}
                          <div className="flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-brand-300 flex-shrink-0">
                              #{step.step_number}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs bg-slate-800 px-2 py-0.5 rounded text-amber-300 border border-slate-700">
                                  Bin {step.bin_code}
                                </span>
                                <span className="text-slate-400 font-mono text-[11px]">
                                  ({step.zone_code} / Aisle {step.aisle} / Shelf {step.shelf})
                                </span>
                              </div>
                              <div className="text-sm font-bold text-white mt-1">
                                {step.product_name}
                              </div>
                              <div className="text-xs text-slate-400 font-mono mt-0.5">
                                SKU: {step.sku} • Pick Quantity: <strong className="text-emerald-400 font-bold">{step.quantity} units</strong>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                            {isPicked ? (
                              <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-xs flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Picked</span>
                              </span>
                            ) : isMissing ? (
                              <span className="px-3 py-1.5 rounded-xl bg-rose-950 text-rose-300 border border-rose-800 font-bold text-xs flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Reported Missing</span>
                              </span>
                            ) : isDamaged ? (
                              <span className="px-3 py-1.5 rounded-xl bg-rose-950 text-rose-300 border border-rose-800 font-bold text-xs flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Reported Damaged</span>
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStepAction(step.step_number, 'PICK')}
                                  disabled={actionLoading}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-emerald transition-all flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Confirm Pick</span>
                                </button>
                                <button
                                  onClick={() => handleStepAction(step.step_number, 'MISSING')}
                                  disabled={actionLoading}
                                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 border border-slate-700 hover:border-rose-700 text-xs font-semibold transition-colors"
                                  title="Report Missing Unit"
                                >
                                  Missing
                                </button>
                                <button
                                  onClick={() => handleStepAction(step.step_number, 'DAMAGED')}
                                  disabled={actionLoading}
                                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 border border-slate-700 hover:border-rose-700 text-xs font-semibold transition-colors"
                                  title="Report Damaged Unit"
                                >
                                  Damaged
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a task from the left queue to view the optimized picking route.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PickingWorkspace;
