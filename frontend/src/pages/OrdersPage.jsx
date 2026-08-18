import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShoppingCart, Search, Filter, Flame, Clock, CheckCircle2,
  AlertCircle, ArrowRight, Eye, Plus, Zap, Truck, RotateCcw, X, HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import TimelineTracker from '../components/TimelineTracker';
import { orderApi, allocationApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [slaRiskOnly, setSlaRiskOnly] = useState(searchParams.get('sla_risk') === 'true');

  // Selected Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getOrders({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        search: search || undefined,
        sla_risk: slaRiskOnly ? 'true' : undefined,
      });
      setOrders(res.orders || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, priorityFilter, slaRiskOnly]);

  const handleOpenDetail = async (orderId) => {
    try {
      setDetailLoading(true);
      const res = await orderApi.getOrder(orderId);
      setSelectedOrder(res.order);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDispatch = async (orderId) => {
    try {
      await orderApi.dispatchOrder(orderId);
      addToast('Order successfully marked as DISPATCHED to carrier!', 'success');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        handleOpenDetail(orderId);
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-brand-400" />
            <span>Order Fulfillment Operations</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic priority scoring, inventory conflict monitoring, and end-to-end lifecycle tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/allocation')}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-indigo transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>Smart Allocation Hub</span>
          </button>
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
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
              placeholder="Search by order number or customer name..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Search
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* SLA Risk Toggle */}
          <button
            onClick={() => setSlaRiskOnly(!slaRiskOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              slaRiskOnly
                ? 'bg-rose-600 text-white shadow-glow-rose'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-400" />
            <span>SLA Risk Only</span>
          </button>

          {/* Priority Select */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Priority</option>
            <option value="URGENT">Urgent Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="NORMAL">Normal Priority</option>
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="CREATED">Created</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="PARTIALLY_ALLOCATED">Partially Allocated</option>
            <option value="PICKING">Picking</option>
            <option value="PACKING">Packing</option>
            <option value="QC_PASSED">Ready for Dispatch</option>
            <option value="DISPATCHED">Dispatched</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Order Ref</th>
                <th className="py-3.5 px-4">Customer & Tier</th>
                <th className="py-3.5 px-4">Priority & Score</th>
                <th className="py-3.5 px-4">SLA Deadline</th>
                <th className="py-3.5 px-4">Items / Total</th>
                <th className="py-3.5 px-4">Lifecycle Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr
                    key={ord.id}
                    className={`hover:bg-slate-850/50 transition-colors ${
                      ord.is_sla_risk ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {ord.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{ord.customer_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {ord.customer_tier} Tier
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <PriorityBadge
                          priority={ord.priority}
                          score={ord.priority_score}
                          showScore={true}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div
                        className={`flex items-center gap-1.5 font-mono ${
                          ord.is_sla_risk ? 'text-rose-400 font-bold' : 'text-slate-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{ord.hours_until_sla}h remaining</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                        {ord.sla_deadline ? new Date(ord.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-200 font-semibold">{ord.items_count} units</div>
                      <div className="text-[10px] text-slate-400">₹{ord.total_amount?.toLocaleString()}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={ord.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetail(ord.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                      >
                        Details
                      </button>
                      {ord.status === 'CREATED' && (
                        <button
                          onClick={() => navigate('/allocation')}
                          className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow-indigo transition-all"
                        >
                          Allocate
                        </button>
                      )}
                      {ord.status === 'QC_PASSED' && (
                        <button
                          onClick={() => handleDispatch(ord.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-glow-emerald transition-all"
                        >
                          Dispatch
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-panel w-full max-w-4xl rounded-3xl border border-brand-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-600/30 border border-brand-500/50 text-brand-300">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-white">
                      {selectedOrder.order_number}
                    </span>
                    <StatusBadge status={selectedOrder.status} />
                    <PriorityBadge
                      priority={selectedOrder.priority}
                      score={selectedOrder.priority_score}
                      showScore={true}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedOrder.customer_name} ({selectedOrder.customer_tier} Tier)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* Lifecycle Progress Stepper */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Order Lifecycle Progression
                </span>
                <TimelineTracker
                  status={selectedOrder.status}
                  hasException={selectedOrder.exceptions_count > 0}
                />
              </div>

              {/* Priority Scoring Explainability Breakdown (Section 7) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-brand-500/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-brand-300 font-bold uppercase tracking-wider text-xs">
                    <Zap className="w-4 h-4 text-brand-400" />
                    <span>Smart Priority Score Analysis</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    {Math.round(selectedOrder.priority_score || 0)} / 100
                  </span>
                </div>

                <p className="text-slate-200 font-medium leading-relaxed">
                  {selectedOrder.priority_reason || 'Standard priority allocation queue.'}
                </p>

                {selectedOrder.priority_breakdown && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-800 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block">Base Priority:</span>
                      <span className="font-mono font-bold text-white">
                        +{selectedOrder.priority_breakdown.base_priority_points || 0} pts
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block">SLA Urgency:</span>
                      <span className="font-mono font-bold text-amber-400">
                        +{selectedOrder.priority_breakdown.sla_urgency_points || 0} pts
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block">Customer Tier:</span>
                      <span className="font-mono font-bold text-indigo-400">
                        +{selectedOrder.priority_breakdown.customer_tier_points || 0} pts
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block">Order Age:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        +{selectedOrder.priority_breakdown.order_age_points || 0} pts
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  Requested SKUs & Allocation Status
                </h4>
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">Req</th>
                        <th className="py-2.5 px-3">Alloc</th>
                        <th className="py-2.5 px-3">Picked</th>
                        <th className="py-2.5 px-3">Shortage</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {selectedOrder.items?.map((it) => (
                        <tr key={it.id} className="hover:bg-slate-850/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-brand-300">{it.sku}</td>
                          <td className="py-2.5 px-3 text-slate-200">{it.name}</td>
                          <td className="py-2.5 px-3 font-mono">{it.quantity_requested}</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400">{it.quantity_allocated}</td>
                          <td className="py-2.5 px-3 font-mono text-cyan-400">{it.quantity_picked}</td>
                          <td className="py-2.5 px-3 font-mono text-rose-400">{it.shortage}</td>
                          <td className="py-2.5 px-3"><StatusBadge status={it.status} size="sm" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chronological Audit Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  Audit History & Decision Ledger
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.audit_timeline?.length === 0 ? (
                    <p className="text-slate-500 italic">No audit events recorded yet.</p>
                  ) : (
                    selectedOrder.audit_timeline?.map((a, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                        <div>
                          <span className="font-bold text-slate-200 font-mono">{a.action}</span>
                          <span className="text-slate-400 ml-2">by {a.performed_by}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                          {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
              {selectedOrder.status === 'CREATED' && (
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    navigate('/allocation');
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-glow-indigo transition-all"
                >
                  Proceed to Smart Allocation
                </button>
              )}
              {selectedOrder.status === 'QC_PASSED' && (
                <button
                  onClick={() => handleDispatch(selectedOrder.id)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-glow-emerald transition-all flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>Confirm Dispatch</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
