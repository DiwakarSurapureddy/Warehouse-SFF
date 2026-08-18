import React, { useState, useEffect } from 'react';
import {
  RefreshCw, Package, Truck, AlertTriangle, CheckCircle2,
  IndianRupee, Clock, ShieldAlert, Zap, Plus, ArrowRight
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { replenishmentApi } from '../services/api';
import { useWarehouse } from '../context/WarehouseContext';
import { useToast } from '../context/ToastContext';

const ReplenishmentPage = () => {
  const { selectedWarehouseId } = useWarehouse();
  const { addToast } = useToast();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderingId, setOrderingId] = useState(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await replenishmentApi.getRecommendations(selectedWarehouseId);
      setRecommendations(res.recommendations || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedWarehouseId]);

  const handleCreatePO = async (rec) => {
    setOrderingId(rec.product_id);
    try {
      await replenishmentApi.createPurchaseOrder({
        product_id: rec.product_id,
        quantity: rec.recommended_reorder_qty,
        warehouse_id: selectedWarehouseId,
      });
      addToast(
        `Purchase Order generated for ${rec.recommended_reorder_qty} units of ${rec.sku} (${rec.supplier_name})`,
        'success'
      );
      fetchRecommendations();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setOrderingId(null);
    }
  };

  const totalCost = recommendations.reduce((acc, r) => acc + (r.total_order_cost || 0), 0);
  const criticalCount = recommendations.filter((r) => r.urgency === 'CRITICAL').length;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-brand-500/40 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/30 border border-brand-500/50 flex items-center justify-center shadow-glow-indigo text-brand-300">
            <RefreshCw className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Predictive Replenishment & Procurement
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-950 text-brand-300 border border-brand-800 uppercase font-mono">
                Statistical Safety Stock
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Automated demand runout modeling, supplier lead time buffers, and 1-click PO dispatch.
            </p>
          </div>
        </div>

        <button
          onClick={fetchRecommendations}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Stock Velocity</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30">
          <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Critical Stockouts</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{criticalCount} SKUs</div>
          <p className="text-[11px] text-slate-400 mt-1">Runout within lead time window</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Recommended Restock Items</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{recommendations.length} SKUs</div>
          <p className="text-[11px] text-slate-400 mt-1">Below target safety stock buffer</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Recommended PO Value</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">₹{totalCost.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 mt-1">Estimated landed cost</p>
        </div>
      </div>

      {/* Recommendations Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Automated Reorder Recommendations ({recommendations.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Safety Stock: Z=1.65 (95% SLA)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Calculating demand velocity and replenishment points...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">All Stock Levels Optimal</h4>
            <p className="text-xs text-slate-400">All tracked inventory is above safety stock thresholds.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {recommendations.map((rec) => {
              const isCrit = rec.urgency === 'CRITICAL';
              return (
                <div
                  key={rec.product_id}
                  className={`glass-panel p-5 rounded-3xl border transition-all ${
                    isCrit
                      ? 'border-rose-500/50 shadow-glow-rose bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/20'
                      : 'border-slate-800 hover:border-brand-500/40'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-bold text-base text-white">{rec.sku}</span>
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                            isCrit
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {rec.urgency} Urgency
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Supplier: <strong className="text-slate-200">{rec.supplier_name}</strong>
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-200">{rec.name}</h4>
                      <p className="text-xs text-slate-400">{rec.risk_assessment}</p>

                      {/* Stock Metrics Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-[11px] font-mono">
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Available</span>
                          <span className="text-emerald-400 font-bold">{rec.available_stock} u</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Daily Demand</span>
                          <span className="text-white font-bold">{rec.daily_demand} u/day</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Days Left</span>
                          <span className="text-amber-400 font-bold">{rec.days_of_stock} days</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Lead Time</span>
                          <span className="text-slate-300 font-bold">{rec.lead_time_days} days</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                          <span className="text-slate-500 block text-[10px]">Reorder Point</span>
                          <span className="text-indigo-400 font-bold">{rec.reorder_point} u</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action & Order Sizing */}
                    <div className="lg:w-72 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between text-xs space-y-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Recommended Batch PO
                        </span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-bold font-mono text-white">
                            {rec.recommended_reorder_qty} units
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            ₹{rec.total_order_cost.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCreatePO(rec)}
                        disabled={orderingId === rec.product_id}
                        className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-glow-indigo transition-all flex items-center justify-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        <span>
                          {orderingId === rec.product_id ? 'Transmitting PO...' : 'Approve & Create PO'}
                        </span>
                      </button>
                    </div>
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

export default ReplenishmentPage;
