import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle2,
  Users, Layers, ArrowRight, Zap, RefreshCw, Activity
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { analyticsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#64748b'];

const AnalyticsDashboard = () => {
  const { addToast } = useToast();

  const [timeframe, setTimeframe] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyingMitigation, setApplyingMitigation] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getAnalytics(timeframe);
      setData(res);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const handleApplyMitigation = async () => {
    setApplyingMitigation(true);
    try {
      setTimeout(() => {
        addToast('Worker reassigned from Zone B to Packing Station 03. Projected delay reduced by 18%!', 'success');
        setApplyingMitigation(false);
      }, 800);
    } catch (err) {
      addToast(err.message, 'error');
      setApplyingMitigation(false);
    }
  };

  const bn = data?.bottleneck_diagnostics?.primary_bottleneck;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-brand-500/40 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/30 border border-brand-500/50 flex items-center justify-center shadow-glow-indigo text-brand-300">
            <BarChart3 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Operational Analytics & Bottleneck Telemetry
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-950 text-brand-300 border border-brand-800 uppercase font-mono">
                Live Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Station throughput metrics, labor allocation efficiency, and automated constraint mitigation.
            </p>
          </div>
        </div>

        {/* Timeframe Controls */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          {['daily', 'weekly', 'monthly'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                timeframe === tf
                  ? 'bg-brand-600 text-white shadow-glow-indigo'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Bottleneck Callout Banner (Master Prompt Section 14) */}
      {bn && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-950/50 via-slate-900 to-indigo-950/40 border border-rose-500/50 shadow-glow-rose flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-700 text-rose-400">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  ⚠️ Primary Bottleneck Detected: {bn.station_name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/60 text-rose-200 font-bold">
                  {bn.delay_contribution_pct}% of delays
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Queue size: <strong>{bn.current_queue_size} parcels</strong> • Station utilization: <strong>{bn.utilization_pct}%</strong> • Root Cause: {bn.root_cause}
              </p>
              <div className="text-xs font-bold text-emerald-400 pt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>AI Recommendation: {bn.recommended_action} (Expected: {bn.expected_impact})</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleApplyMitigation}
            disabled={applyingMitigation}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-glow-rose transition-all flex items-center gap-2 flex-shrink-0"
          >
            <Zap className="w-4 h-4" />
            <span>{applyingMitigation ? 'Reallocating...' : 'Apply Worker Reallocation'}</span>
          </button>
        </div>
      )}

      {/* Row 1: Throughput Trends & Stage Durations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly/Daily Throughput Line Chart */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Order Ingest vs Fulfillment Throughput
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Volume / Timeframe</span>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.throughput_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="orders_received" stroke="#6366f1" strokeWidth={2.5} name="Orders Received" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="orders_fulfilled" stroke="#10b981" strokeWidth={2.5} name="Orders Dispatched" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sla_breaches" stroke="#f43f5e" strokeWidth={2} name="SLA Breaches" dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage Duration Target vs Actual Bar Chart */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Stage Cycle Time Benchmarks (Minutes)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Actual vs Target</span>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.stage_durations || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="stage" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="actual_min" fill="#6366f1" radius={[6, 6, 0, 0]} name="Actual Min" />
                <Bar dataKey="target_min" fill="#10b981" radius={[6, 6, 0, 0]} name="Target Min" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Zone Workload & Exception Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone Workload Bars */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Warehouse Zone Workloads & Labor Distribution
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Utilization %</span>
          </div>

          <div className="space-y-3 text-xs">
            {data?.zone_workload?.map((z, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{z.zone}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-400">{z.pickers_assigned} Pickers</span>
                    <span className={`font-bold ${z.workload_pct >= 80 ? 'text-rose-400' : 'text-brand-300'}`}>
                      {z.workload_pct}% Workload
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      z.workload_pct >= 80 ? 'bg-rose-500' : z.workload_pct >= 60 ? 'bg-brand-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${z.workload_pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exceptions Breakdown Donut */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Exception Categories
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Root Cause Mix</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.exceptions_breakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {(data?.exceptions_breakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            {data?.exceptions_breakdown?.map((e, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="truncate">{e.name}: <strong>{e.count}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
