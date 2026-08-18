import React, { useState, useEffect } from 'react';
import {
  AlertOctagon, AlertTriangle, CheckCircle2, XCircle, Brain,
  Search, Filter, RefreshCw, ArrowRight, ShieldAlert, Zap
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ExceptionResolutionModal from '../components/ExceptionResolutionModal';
import { exceptionApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const ExceptionCenter = () => {
  const { addToast } = useToast();

  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [resolvingExceptionId, setResolvingExceptionId] = useState(null);

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const res = await exceptionApi.getExceptions({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
      });
      setExceptions(res.exceptions || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [statusFilter, severityFilter, typeFilter]);

  const openCount = exceptions.filter((e) => e.resolution_status === 'OPEN').length;
  const criticalCount = exceptions.filter((e) => e.severity === 'CRITICAL' && e.resolution_status === 'OPEN').length;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-rose-500/40 bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center shadow-glow-rose text-rose-300">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Crisis & Exception Operations Center
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 uppercase font-mono">
                {openCount} Open Issues
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous root cause classification, mitigation modeling, and audit-compliant supervisor resolution.
            </p>
          </div>
        </div>

        <button
          onClick={fetchExceptions}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Exceptions</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter By:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Exceptions Only</option>
            <option value="RESOLVED">Resolved Only</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Severity</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Exception Types</option>
            <option value="DAMAGED_ITEM">Damaged Item</option>
            <option value="MISSING_ITEM">Missing Item</option>
            <option value="STOCK_SHORTAGE">Stock Shortage</option>
            <option value="FAILED_QC">Failed QC</option>
            <option value="DELAYED_PACKING">Delayed Packing</option>
            <option value="SLA_RISK">SLA Risk</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-rose-400 font-bold">{criticalCount} Critical</span>
          <span>•</span>
          <span>{openCount} Total Open</span>
        </div>
      </div>

      {/* Exception Cards Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Scanning warehouse telemetry for operational exceptions...
          </div>
        ) : exceptions.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Zero Active Exceptions</h4>
            <p className="text-xs text-slate-400">All picking, packing, QC, and stock pipelines operating cleanly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {exceptions.map((exc) => {
              const isOpen = exc.resolution_status === 'OPEN';
              const isCrit = exc.severity === 'CRITICAL';

              return (
                <div
                  key={exc.id}
                  className={`glass-panel p-5 rounded-3xl border transition-all duration-300 ${
                    isOpen && isCrit
                      ? 'border-rose-500/50 shadow-glow-rose bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/20'
                      : isOpen
                      ? 'border-amber-500/40 shadow-glow-amber bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/15'
                      : 'border-slate-800/80 opacity-75'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Problem & Entity */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          #{exc.id}
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          {exc.exception_type.replace(/_/g, ' ')}
                        </h4>
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                            exc.severity === 'CRITICAL'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : exc.severity === 'HIGH'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {exc.severity} Severity
                        </span>
                        <StatusBadge status={exc.resolution_status} size="sm" />
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        {exc.impact_summary}
                      </p>

                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3 pt-1">
                        <span>Order: <strong className="text-brand-300">{exc.order_number}</strong></span>
                        {exc.sku !== 'N/A' && (
                          <span>SKU: <strong className="text-slate-200">{exc.sku}</strong></span>
                        )}
                        <span>Reported: {exc.created_at ? new Date(exc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                    </div>

                    {/* AI Recommendation & Action */}
                    <div className="lg:w-1/2 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-brand-300 font-bold uppercase text-[10px] tracking-wider">
                        <Brain className="w-3.5 h-3.5 text-brand-400" />
                        <span>AI Recommended Resolution</span>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed">{exc.ai_recommendation}</p>

                      {isOpen ? (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => setResolvingExceptionId(exc.id)}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-glow-rose transition-all flex items-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Resolve Exception</span>
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 text-[11px] text-emerald-400 flex items-center gap-1.5 border-t border-slate-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolved: {exc.resolution_action}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolution Wizard Modal */}
      {resolvingExceptionId && (
        <ExceptionResolutionModal
          exceptionId={resolvingExceptionId}
          isOpen={true}
          onClose={() => setResolvingExceptionId(null)}
          onResolved={fetchExceptions}
        />
      )}
    </div>
  );
};

export default ExceptionCenter;
