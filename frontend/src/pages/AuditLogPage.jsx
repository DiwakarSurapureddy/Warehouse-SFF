import React, { useState, useEffect } from 'react';
import {
  History, Search, Filter, ShieldCheck, Database, RefreshCw,
  Brain, FileText, CheckCircle2, Clock
} from 'lucide-react';
import { auditApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const AuditLogPage = () => {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('audit'); // audit or decisions
  const [logs, setLogs] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('ALL');

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const [auditRes, decRes] = await Promise.all([
        auditApi.getAuditLogs({ entity_type: entityFilter !== 'ALL' ? entityFilter : undefined }),
        auditApi.getDecisionLogs(),
      ]);
      setLogs(auditRes.audit_logs || []);
      setDecisions(decRes.decisions || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [entityFilter]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-brand-500/40 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center shadow-glow-indigo text-indigo-300">
            <History className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Audit Trail & Autonomous Decision Ledger
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-mono">
                Immutable Ledger
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              End-to-end transparency, regulatory compliance, and system explainability records.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAuditData}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-brand-600 text-white shadow-glow-indigo'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>State-Change Audit Logs ({logs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('decisions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'decisions'
                ? 'bg-brand-600 text-white shadow-glow-indigo'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>AI Decision Explanations ({decisions.length})</span>
          </button>
        </div>

        {activeTab === 'audit' && (
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Entity Types</option>
            <option value="ORDER">Orders</option>
            <option value="INVENTORY">Inventory</option>
            <option value="PICKING">Picking</option>
            <option value="PACKING">Packing</option>
            <option value="QC">Quality Check</option>
            <option value="EXCEPTION">Exceptions</option>
          </select>
        )}
      </div>

      {/* Tables Feed */}
      {activeTab === 'audit' ? (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Entity Type</th>
                  <th className="py-3.5 px-4">Target Ref</th>
                  <th className="py-3.5 px-4">Action Taken</th>
                  <th className="py-3.5 px-4">Actor / System</th>
                  <th className="py-3.5 px-4">Context Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">Loading audit ledger...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">No audit events found.</td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {l.created_at ? new Date(l.created_at).toLocaleString() : ''}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-brand-300 border border-slate-700">
                          {l.entity_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {l.entity_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200">{l.action}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {l.performed_by}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 truncate max-w-xs">
                        {JSON.stringify(l.details)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {decisions.map((d) => (
            <div key={d.id} className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-brand-300">{d.decision_type}</span>
                  <span className="text-slate-400">• Ref: <strong className="text-white">{d.context_ref}</strong></span>
                </div>
                <span className="text-slate-500 font-mono">
                  {d.created_at ? new Date(d.created_at).toLocaleString() : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Recommended Action</span>
                  <div className="font-semibold text-slate-200">{d.recommended_action}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">Expected Impact</span>
                  <div>{d.expected_impact}</div>
                </div>
              </div>

              {d.reasons?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Reasoning Factors:</span>
                  {d.reasons.map((r, idx) => (
                    <div key={idx} className="text-slate-300">• {r}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
