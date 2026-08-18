import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, ShoppingCart, AlertTriangle, Flame, Clock, CheckCircle2,
  TrendingUp, Zap, Sparkles, ArrowRight, Truck, Box, ShieldCheck,
  RotateCcw, Activity, Play
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import DecisionCard from '../components/DecisionCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { dashboardApi, allocationApi, orderApi } from '../services/api';
import { useWarehouse } from '../context/WarehouseContext';
import { useToast } from '../context/ToastContext';

const ControlTower = () => {
  const navigate = useNavigate();
  const { selectedWarehouseId } = useWarehouse();
  const { addToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const res = await dashboardApi.getControlTower(selectedWarehouseId);
      setData(res);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [selectedWarehouseId]);

  const handleExecuteRecommendation = async (rec) => {
    setActionLoading(rec.id);
    try {
      if (rec.action_type === 'PRIORITIZE_ORDER') {
        navigate('/allocation');
      } else if (rec.action_type === 'RESOLVE_BOTTLENECK') {
        navigate('/analytics');
      } else if (rec.action_type === 'OPEN_REPLENISHMENT') {
        navigate('/replenishment');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Loading Real-Time Warehouse Control Tower...</p>
        </div>
      </div>
    );
  }

  const inv = data?.inventory_metrics || {};
  const ord = data?.order_metrics || {};
  const kpi = data?.kpi_metrics || {};
  const recommendations = data?.ai_recommendations || [];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Top Banner: Decision Intelligence Active */}
      <div className="glass-panel p-6 rounded-3xl border border-brand-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/30 border border-brand-500/50 flex items-center justify-center shadow-glow-indigo text-brand-300">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Executive Control Tower
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 uppercase font-mono">
                Live State
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous fulfillment lifecycle, real-time priority scoring, and bottleneck prevention.
            </p>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/allocation')}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-indigo transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>Smart Allocation</span>
          </button>
          <button
            onClick={() => navigate('/exceptions')}
            className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Exception Center ({kpi.open_exceptions_count || 0})</span>
          </button>
        </div>
      </div>

      {/* Row 1: High-Priority Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Fulfillment Rate"
          value={`${kpi.fulfillment_rate_pct || 92.4}%`}
          subtext="Processed on-time today"
          icon={TrendingUp}
          trend="+3.2%"
          trendLabel="vs yesterday"
          trendPositive={true}
          glowColor="emerald"
        />
        <MetricCard
          title="Orders at SLA Risk"
          value={ord.sla_risk_orders || 0}
          subtext={`${ord.urgent_orders || 0} Critical / Urgent in queue`}
          icon={Flame}
          trend={ord.sla_risk_orders > 0 ? "Requires Action" : "Nominal"}
          trendPositive={ord.sla_risk_orders === 0}
          glowColor={ord.sla_risk_orders > 0 ? "rose" : "indigo"}
          onClick={() => navigate('/orders?sla_risk=true')}
        />
        <MetricCard
          title="Available Inventory"
          value={`${inv.available_stock || 0} units`}
          subtext={`Valued at $${(inv.inventory_value || 0).toLocaleString()}`}
          icon={Package}
          trend={`${inv.low_stock_skus || 0} low stock`}
          trendLabel="SKUs"
          trendPositive={inv.out_of_stock_skus === 0}
          glowColor="cyan"
          onClick={() => navigate('/inventory')}
        />
        <MetricCard
          title="Avg Cycle Time"
          value={`${kpi.avg_fulfillment_time_min || 28.5}m`}
          subtext="Pick → Pack → QC → Dispatch"
          icon={Clock}
          trend="-4.1m"
          trendLabel="faster"
          trendPositive={true}
          glowColor="indigo"
          onClick={() => navigate('/analytics')}
        />
      </div>

      {/* Row 2: AI Recommended Actions Feed (Master Prompt Section 4) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider text-sm">
              AI Recommended Operational Actions
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {recommendations.length} Active System Decisions
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`glass-panel p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                rec.severity === 'CRITICAL'
                  ? 'border-rose-500/40 shadow-glow-rose bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/20'
                  : rec.severity === 'HIGH'
                  ? 'border-amber-500/40 shadow-glow-amber bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20'
                  : 'border-brand-500/30 shadow-glow-indigo bg-gradient-to-b from-slate-900 via-slate-900 to-brand-950/20'
              }`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-full border ${
                      rec.severity === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : rec.severity === 'HIGH'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-brand-950 text-brand-300 border-brand-800'
                    }`}
                  >
                    {rec.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">{rec.severity}</span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug">{rec.title}</h4>
                <p className="text-xs text-slate-300 mt-2 font-medium leading-relaxed">
                  {rec.action_summary}
                </p>

                {/* Steps */}
                <div className="mt-3.5 space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {rec.steps?.map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-brand-400 font-bold">→</span>
                      <span className="leading-tight">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expected Improvement & CTA */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <div className="text-[11px] font-semibold text-emerald-400 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Expected: {rec.expected_improvement}</span>
                </div>

                <button
                  onClick={() => handleExecuteRecommendation(rec)}
                  disabled={actionLoading === rec.id}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                    rec.severity === 'CRITICAL'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-glow-rose'
                      : rec.severity === 'HIGH'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-glow-amber'
                      : 'bg-brand-600 hover:bg-brand-500 shadow-glow-indigo'
                  }`}
                >
                  <span>{actionLoading === rec.id ? 'Opening...' : rec.cta_text}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Pipeline & Inventory Distribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Fulfillment Pipeline Tracker */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Live Order Fulfillment Flow
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time queue volume across 7 execution lifecycle gates
              </p>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
            {[
              { label: 'Pending Alloc', count: ord.pending_orders, path: '/allocation', color: 'slate' },
              { label: 'Allocated', count: ord.allocated_orders, path: '/picking', color: 'indigo' },
              { label: 'Picking', count: ord.picking_orders, path: '/picking', color: 'cyan' },
              { label: 'Packing', count: ord.packing_orders, path: '/packing', color: 'blue' },
              { label: 'QC Station', count: ord.qc_orders, path: '/qc', color: 'amber' },
              { label: 'Ready Dispatch', count: ord.ready_dispatch_orders, path: '/orders', color: 'teal' },
              { label: 'Dispatched', count: ord.dispatched_orders, path: '/orders', color: 'emerald' },
            ].map((st, i) => (
              <div
                key={i}
                onClick={() => navigate(st.path)}
                className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-brand-500/50 hover:bg-slate-900 cursor-pointer transition-all text-center"
              >
                <div className="text-xl font-bold font-mono text-white">{st.count || 0}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-1 truncate">{st.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Health Summary */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Inventory Health Radar
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Categorized SKU distribution</p>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              Inventory Tab
            </button>
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Healthy Stock SKUs</span>
              </div>
              <span className="font-mono font-bold text-white">{inv.healthy_skus || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-slate-300">Low Stock SKUs (Reorder)</span>
              </div>
              <span className="font-mono font-bold text-amber-400">{inv.low_stock_skus || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-300">Out of Stock SKUs</span>
              </div>
              <span className="font-mono font-bold text-rose-400">{inv.out_of_stock_skus || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-slate-300">Damaged / Missing Units</span>
              </div>
              <span className="font-mono font-bold text-rose-300">
                {(inv.damaged_stock || 0) + (inv.missing_stock || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlTower;
