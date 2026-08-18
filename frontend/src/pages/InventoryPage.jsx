import React, { useState, useEffect } from 'react';
import {
  Package, Search, Filter, AlertTriangle, TrendingUp,
  Plus, Edit, Eye, ArrowRight, ShieldAlert, BarChart2, X, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import StatusBadge from '../components/StatusBadge';
import { inventoryApi } from '../services/api';
import { useWarehouse } from '../context/WarehouseContext';
import { useToast } from '../context/ToastContext';

const InventoryPage = () => {
  const { selectedWarehouseId } = useWarehouse();
  const { addToast } = useToast();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [healthFilter, setHealthFilter] = useState('ALL');

  // Adjustment Modal
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [deltaTotal, setDeltaTotal] = useState(0);
  const [deltaDamaged, setDeltaDamaged] = useState(0);
  const [deltaMissing, setDeltaMissing] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Demand Forecast Modal
  const [forecastItem, setForecastItem] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getInventory({
        warehouse_id: selectedWarehouseId,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        health_status: healthFilter !== 'ALL' ? healthFilter : undefined,
        search: search || undefined,
      });
      setInventory(res.inventory || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedWarehouseId, categoryFilter, healthFilter]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustModalItem) return;

    setAdjusting(true);
    try {
      await inventoryApi.adjustStock(adjustModalItem.id, {
        delta_total: deltaTotal,
        delta_damaged: deltaDamaged,
        delta_missing: deltaMissing,
        reason: adjustReason || 'Manual inventory correction',
      });
      addToast('Inventory adjusted successfully and logged to audit ledger', 'success');
      setAdjustModalItem(null);
      fetchInventory();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setAdjusting(false);
    }
  };

  const handleOpenForecast = async (item) => {
    setForecastItem(item);
    setForecastLoading(true);
    try {
      const res = await inventoryApi.getProductForecast(item.product_id, 14);
      setForecastData(res);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setForecastLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-brand-400" />
            <span>Inventory Intelligence & Stock Health</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stock computation (<code className="text-brand-300">Available = Total - Reserved - Damaged - Missing</code>) & predictive stockout radar.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
              placeholder="Search SKU, name, or bin location..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            onClick={fetchInventory}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Industrial">Industrial Tools</option>
            <option value="Apparel & Gear">Apparel & Gear</option>
            <option value="Home & Living">Home & Living</option>
            <option value="Office">Office Ergonomics</option>
          </select>

          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Health Statuses</option>
            <option value="HEALTHY">Healthy</option>
            <option value="LOW_STOCK">Low Stock (Reorder)</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="OVERSTOCK">Overstock</option>
            <option value="DAMAGED">Has Damaged Units</option>
            <option value="MISSING">Has Missing Units</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">SKU & Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Facility / Zone / Bin</th>
                <th className="py-3.5 px-4 text-center">Available Stock</th>
                <th className="py-3.5 px-4 text-center">Reserved</th>
                <th className="py-3.5 px-4 text-center">Damaged / Missing</th>
                <th className="py-3.5 px-4">Health Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading inventory records...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No matching inventory records found.
                  </td>
                </tr>
              ) : (
                inventory.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-white">{inv.product_sku}</div>
                      <div className="text-slate-300 text-[11px] truncate max-w-xs">{inv.product_name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{inv.category}</td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-semibold text-slate-200">
                        {inv.warehouse_code} → {inv.zone_code}
                      </div>
                      <div className="text-[10px] text-brand-300">Bin {inv.bin_code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-extrabold text-sm text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                        {inv.available_stock} u
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-indigo-300 font-semibold">
                      {inv.reserved_stock} u
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {inv.damaged_stock > 0 || inv.missing_stock > 0 ? (
                        <span className="text-rose-400 font-bold bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-800/60">
                          {inv.damaged_stock}D / {inv.missing_stock}M
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inv.health_status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenForecast(inv)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-semibold transition-colors"
                        title="View Demand Forecast"
                      >
                        Forecast
                      </button>
                      <button
                        onClick={() => {
                          setAdjustModalItem(inv);
                          setDeltaTotal(0);
                          setDeltaDamaged(0);
                          setDeltaMissing(0);
                          setAdjustReason('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                        title="Adjust Stock or Cycle Count"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                Adjust Inventory Stock / Cycle Count
              </h3>
              <button
                onClick={() => setAdjustModalItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div>SKU: <strong className="font-mono text-brand-300">{adjustModalItem.product_sku}</strong></div>
              <div>Location: <strong>Bin {adjustModalItem.bin_code} ({adjustModalItem.warehouse_name})</strong></div>
              <div>Current Available: <strong>{adjustModalItem.available_stock} units</strong></div>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">
                  Adjust Total Physical Stock (+ / -)
                </label>
                <input
                  type="number"
                  value={deltaTotal}
                  onChange={(e) => setDeltaTotal(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-rose-400 font-bold uppercase mb-1">
                    Report Damaged Units
                  </label>
                  <input
                    type="number"
                    value={deltaDamaged}
                    onChange={(e) => setDeltaDamaged(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-amber-400 font-bold uppercase mb-1">
                    Report Missing Units
                  </label>
                  <input
                    type="number"
                    value={deltaMissing}
                    onChange={(e) => setDeltaMissing(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">
                  Adjustment Reason & Audit Justification
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Cycle count discrepancy / physical stock inspection..."
                  rows={2}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-glow-indigo"
                >
                  {adjusting ? 'Updating Ledger...' : 'Commit Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Demand Forecast Chart Modal (Section 6) */}
      {forecastItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-indigo-500/40 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <BarChart2 className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">
                  Predictive Demand & Stockout Horizon Radar
                </h3>
              </div>
              <button
                onClick={() => setForecastItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forecastLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Fitting statistical regression model & simulating stock depletion...
              </div>
            ) : forecastData ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-white text-sm">{forecastData.sku}</span>
                    <p className="text-slate-400">{forecastData.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Estimated Days Remaining</div>
                    <div className="text-base font-mono font-bold text-amber-400">
                      {forecastData.estimated_days_remaining} Days
                    </div>
                  </div>
                </div>

                {/* 14-Day Projected Stock Chart */}
                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData.timeline}>
                      <defs>
                        <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="projected_stock"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#stockGrad)"
                        name="Projected Units"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/30 border border-brand-800/60 flex items-center justify-between">
                  <span className="text-slate-300">
                    5-Day Stockout Probability Risk: <strong className="text-rose-400 font-mono">{forecastData.stockout_risk_5d_pct}%</strong>
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Rec Reorder: {forecastData.recommended_reorder_qty} units
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
