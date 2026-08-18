import React, { useState, useEffect } from 'react';
import {
  Sliders, Play, Zap, AlertTriangle, TrendingUp, TrendingDown,
  RotateCcw, CheckCircle2, ArrowRight, ShieldCheck, Sparkles
} from 'lucide-react';
import { simulatorApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const SimulatorPage = () => {
  const { addToast } = useToast();

  const [presets, setPresets] = useState({});
  const [selectedPresetKey, setSelectedPresetKey] = useState('');

  // Simulator Inputs
  const [demandMultiplier, setDemandMultiplier] = useState(1.25);
  const [laborCapacity, setLaborCapacity] = useState(85);
  const [supplierDelay, setSupplierDelay] = useState(3);
  const [zoneOffline, setZoneOffline] = useState(false);

  const [result, setResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    simulatorApi.getPresets().then((res) => {
      setPresets(res.presets || {});
      // Run initial baseline
      handleRunSimulation();
    });
  }, []);

  const handleApplyPreset = (presetKey) => {
    setSelectedPresetKey(presetKey);
    const p = presets[presetKey];
    if (p) {
      setDemandMultiplier(p.demand_multiplier);
      setLaborCapacity(p.worker_availability_pct);
      setSupplierDelay(p.supplier_delay_days);
      setZoneOffline(p.zone_offline);
    }
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      const res = await simulatorApi.runSimulation({
        demand_multiplier: demandMultiplier,
        labor_capacity_pct: laborCapacity,
        supplier_delay_days: supplierDelay,
        zone_offline: zoneOffline,
        scenario_name: selectedPresetKey ? presets[selectedPresetKey]?.name : 'Custom Warehouse Stress Test',
      });
      setResult(res);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSimulating(false);
    }
  };

  const baseline = result?.baseline || {};
  const simulated = result?.simulated || {};
  const mitigated = result?.mitigated_projection || {};

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-brand-500/40 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center shadow-glow-indigo text-purple-300">
            <Sliders className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Warehouse Scenario Simulator
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 uppercase font-mono">
                What-If Sandbox
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Stress-test supply chain shocks, labor deficits, and demand spikes to visualize SLA vulnerability and auto-generate mitigations.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={simulating}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-glow-indigo transition-all flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          <span>{simulating ? 'Simulating Physics...' : 'Run Simulation'}</span>
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Preset Operational Scenarios:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {Object.entries(presets).map(([key, p]) => (
            <button
              key={key}
              onClick={() => handleApplyPreset(key)}
              className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                selectedPresetKey === key
                  ? 'bg-purple-950/60 border-purple-500 text-white shadow-glow-indigo font-bold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <div className="font-bold text-xs text-brand-300">{p.name}</div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {p.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Controls & Simulator Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Stress Sliders */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Operational Stress Parameters
          </h3>

          <div className="space-y-4 text-xs">
            {/* Demand Multiplier Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5 font-semibold">
                <span className="text-slate-300">Order Demand Multiplier</span>
                <span className="font-mono text-brand-300 font-bold text-sm">
                  {Math.round(demandMultiplier * 100)}% ({demandMultiplier > 1 ? `+${Math.round((demandMultiplier - 1) * 100)}%` : 'Baseline'})
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.2"
                step="0.05"
                value={demandMultiplier}
                onChange={(e) => {
                  setDemandMultiplier(parseFloat(e.target.value));
                  setSelectedPresetKey('');
                }}
                className="w-full accent-brand-500 cursor-pointer"
              />
            </div>

            {/* Labor Capacity Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5 font-semibold">
                <span className="text-slate-300">Staff & Picker Availability</span>
                <span className={`font-mono font-bold text-sm ${laborCapacity < 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {laborCapacity}%
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                step="5"
                value={laborCapacity}
                onChange={(e) => {
                  setLaborCapacity(parseInt(e.target.value));
                  setSelectedPresetKey('');
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Supplier Delay Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5 font-semibold">
                <span className="text-slate-300">Supplier Transit Delay</span>
                <span className="font-mono text-amber-400 font-bold text-sm">
                  +{supplierDelay} Days
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                step="1"
                value={supplierDelay}
                onChange={(e) => {
                  setSupplierDelay(parseInt(e.target.value));
                  setSelectedPresetKey('');
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Equipment Failure Toggle */}
            <div
              onClick={() => {
                setZoneOffline(!zoneOffline);
                setSelectedPresetKey('');
              }}
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                zoneOffline
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}
            >
              <div>
                <span className="font-bold block">Zone A Conveyor Offline</span>
                <span className="text-[11px] text-slate-500">Simulates mechanical stoppage</span>
              </div>
              <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 rounded bg-slate-900">
                {zoneOffline ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={simulating}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-glow-indigo transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>Recalculate Projections</span>
          </button>
        </div>

        {/* Right: Comparative State & Recommended Mitigation */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {result?.scenario_name || 'Simulation Results'}
            </h3>
            <span className="text-xs text-brand-300 font-mono">
              3-Way Comparative Matrix
            </span>
          </div>

          {/* Comparative Metrics Grid (Current vs Simulated vs Mitigated) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Baseline Column */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-2">
                1. Current Baseline
              </span>
              <div>
                <div className="text-[10px] text-slate-500">Fulfillment Rate</div>
                <div className="text-xl font-bold font-mono text-white">
                  {baseline.fulfillment_rate_pct}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Avg Cycle Time</div>
                <div className="text-sm font-bold font-mono text-slate-200">
                  {baseline.avg_cycle_time_min} min
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">SLA Breaches</div>
                <div className="text-sm font-bold font-mono text-emerald-400">
                  {baseline.sla_breach_count} orders
                </div>
              </div>
            </div>

            {/* Simulated Stress Column */}
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-800/40 space-y-3 shadow-glow-rose">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block border-b border-rose-800/40 pb-2">
                2. Simulated Stress
              </span>
              <div>
                <div className="text-[10px] text-slate-400">Fulfillment Rate</div>
                <div className="text-xl font-bold font-mono text-rose-400 flex items-center gap-1.5">
                  <span>{simulated.fulfillment_rate_pct}%</span>
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Avg Cycle Time</div>
                <div className="text-sm font-bold font-mono text-rose-300">
                  {simulated.avg_cycle_time_min} min
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Predicted SLA Breaches</div>
                <div className="text-sm font-bold font-mono text-rose-400">
                  +{simulated.sla_breach_count} orders
                </div>
              </div>
            </div>

            {/* Mitigated Projection Column */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 space-y-3 shadow-glow-emerald">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block border-b border-emerald-800/40 pb-2">
                3. With AI Mitigation
              </span>
              <div>
                <div className="text-[10px] text-slate-400">Restored Rate</div>
                <div className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                  <span>{mitigated.fulfillment_rate_pct}%</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Recovered Cycle Time</div>
                <div className="text-sm font-bold font-mono text-emerald-300">
                  {mitigated.avg_cycle_time_min} min
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Mitigated Breaches</div>
                <div className="text-sm font-bold font-mono text-emerald-400">
                  {mitigated.sla_breach_count} order
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommended Mitigations */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-brand-300 font-bold uppercase tracking-wider text-xs">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>AI Recommended Operational Mitigation Strategy</span>
            </div>

            <p className="text-slate-200 font-medium leading-relaxed">{result?.summary}</p>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              {result?.recommended_actions?.map((act, i) => (
                <div key={i} className="flex items-start gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{act}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorPage;
