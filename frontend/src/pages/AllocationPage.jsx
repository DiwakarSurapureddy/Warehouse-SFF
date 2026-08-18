import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch, Zap, AlertTriangle, CheckCircle2, RefreshCw,
  ArrowRight, ShieldAlert, Package, Layers, Sparkles
} from 'lucide-react';
import DecisionCard from '../components/DecisionCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { allocationApi, orderApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const AllocationPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executingOrder, setExecutingOrder] = useState(null);

  const fetchBatchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await allocationApi.getBatchEvaluations();
      setEvaluations(res.evaluations || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchEvaluations();
  }, []);

  const handleConfirmAllocation = async (orderId) => {
    setExecutingOrder(orderId);
    try {
      const res = await allocationApi.confirmAllocation(orderId, {});
      addToast(`Allocation successfully executed for Order #${res.order?.order_number || orderId}!`, 'success');
      // Re-fetch evaluations
      await fetchBatchEvaluations();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setExecutingOrder(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-brand-500/40 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/30 border border-brand-500/50 flex items-center justify-center shadow-glow-indigo text-brand-300">
            <GitBranch className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Smart Inventory Allocation Workbench
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-950 text-brand-300 border border-brand-800 uppercase font-mono">
                Autonomous Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-order scarce stock arbitration, distance minimization, and SLA-loss mitigation.
            </p>
          </div>
        </div>

        <button
          onClick={fetchBatchEvaluations}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Re-Evaluate Queues</span>
        </button>
      </div>

      {/* Evaluated Order Cards Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Pending Allocation Decisions ({evaluations.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Auto-Ranked by Multi-Factor Priority Score
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Evaluating multi-warehouse inventory matrices...
          </div>
        ) : evaluations.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">All Pending Orders Allocated</h4>
            <p className="text-xs text-slate-400">No active inventory allocation backlog detected.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {evaluations.map((ev) => {
              const isShortage = ev.has_shortage;
              return (
                <div
                  key={ev.order_id}
                  className={`glass-panel rounded-3xl border p-6 transition-all duration-300 ${
                    isShortage
                      ? 'border-rose-500/40 shadow-glow-rose bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20'
                      : 'border-brand-500/30 shadow-glow-indigo bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20'
                  }`}
                >
                  {/* Top Meta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-extrabold text-white">
                        {ev.order_number}
                      </span>
                      <PriorityBadge
                        priority={ev.priority}
                        score={ev.priority_score}
                        showScore={true}
                      />
                      <StatusBadge status={ev.overall_decision} />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono font-semibold">
                        Decision Engine Score: <strong className="text-brand-300">{Math.round(ev.priority_score || 0)}/100</strong>
                      </span>
                    </div>
                  </div>

                  {/* Decision Explanation Block */}
                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Recommended Action & Reasoning */}
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          System Recommended Action
                        </span>
                        <p className="text-xs font-bold text-slate-100 leading-snug">
                          {ev.recommended_action}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Why this decision was formulated:</span>
                        </span>
                        {ev.reasons?.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 text-slate-300">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span className="leading-relaxed">{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: SKU Breakdown & Bin Location Allocation Plan */}
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/80">
                        <div className="p-2.5 bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider flex items-center justify-between">
                          <span>SKU Allocation Plan</span>
                          <span>Allocated / Req</span>
                        </div>
                        <div className="divide-y divide-slate-800/60 p-1 text-xs">
                          {ev.items?.map((it) => (
                            <div key={it.item_id} className="p-2.5 flex items-start justify-between gap-2">
                              <div>
                                <div className="font-mono font-bold text-brand-300">{it.sku}</div>
                                <div className="text-slate-300 text-[11px] font-medium">{it.product_name}</div>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  {it.plan?.map((p, pIdx) => (
                                    <span key={pIdx} className="mr-2 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                                      Bin {p.bin_code} (Zone {p.zone_code}): <strong>{p.quantity}u</strong>
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-mono font-bold text-emerald-400">
                                  {it.allocatable_quantity} / {it.quantity_requested} u
                                </div>
                                {it.shortage > 0 && (
                                  <div className="text-[10px] font-mono text-rose-400 font-bold">
                                    -{it.shortage} Shortage
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Expected Impact */}
                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 text-xs">
                        <span className="font-bold text-[10px] uppercase text-emerald-400 block mb-0.5">
                          Projected Operational Impact
                        </span>
                        <span>{ev.expected_impact}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                    <button
                      onClick={() => navigate('/inventory')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                    >
                      Check Alternate Facility Stock
                    </button>
                    <button
                      onClick={() => handleConfirmAllocation(ev.order_id)}
                      disabled={executingOrder === ev.order_id}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                        isShortage
                          ? 'bg-rose-600 hover:bg-rose-500 shadow-glow-rose'
                          : 'bg-brand-600 hover:bg-brand-500 shadow-glow-indigo'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {executingOrder === ev.order_id ? 'Committing Allocation...' : 'Authorize Decision & Lock Stock'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllocationPage;
