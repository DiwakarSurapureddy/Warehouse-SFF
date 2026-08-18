import React from 'react';
import { Brain, CheckCircle, AlertTriangle, ArrowRight, Zap, ShieldAlert } from 'lucide-react';
import PriorityBadge from './PriorityBadge';

const DecisionCard = ({
  title,
  decisionType,
  score,
  recommendedAction,
  reasons = [],
  expectedImpact,
  alternativeAction,
  severity = 'HIGH',
  onApprove,
  onAlternative,
  approveText = 'Execute Recommendation',
  alternativeText = 'View Alternative',
  loading = false,
  className = '',
}) => {
  const isCritical = severity === 'CRITICAL' || score >= 80;

  return (
    <div
      className={`glass-panel rounded-2xl p-6 border relative overflow-hidden transition-all duration-300 ${
        isCritical
          ? 'border-rose-500/40 shadow-glow-rose bg-gradient-to-br from-slate-900 via-slate-900/90 to-rose-950/20'
          : 'border-indigo-500/30 shadow-glow-indigo bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/20'
      } ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isCritical
                ? 'bg-rose-950/60 border-rose-700/60 text-rose-400'
                : 'bg-brand-950/60 border-brand-700/60 text-brand-400'
            }`}
          >
            <Brain className="w-5 h-5 animate-pulse-glow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                Decision Intelligence
              </span>
              {decisionType && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {decisionType}
                </span>
              )}
            </div>
            <h4 className="text-lg font-bold text-white mt-0.5">{title}</h4>
          </div>
        </div>

        {score !== undefined && (
          <div className="text-right flex-shrink-0">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Confidence / Score</div>
            <div className="text-xl font-bold font-mono text-white flex items-center justify-end gap-1">
              <span className={score >= 80 ? 'text-rose-400' : 'text-brand-400'}>{Math.round(score)}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
          </div>
        )}
      </div>

      {/* Recommended Action Box */}
      <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-start gap-2.5">
          <Zap className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isCritical ? 'text-rose-400' : 'text-brand-400'}`} />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recommended Action
            </div>
            <div className="text-sm font-semibold text-slate-100 mt-1 leading-snug">
              {recommendedAction}
            </div>
          </div>
        </div>
      </div>

      {/* Why? (Reasoning Factors) */}
      {reasons && reasons.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Why did the system decide this?</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {reasons.map((r, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expected Impact & Alternative */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {expectedImpact && (
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-emerald-300">
            <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-400 block mb-1">
              Expected Impact
            </span>
            <span className="leading-relaxed">{expectedImpact}</span>
          </div>
        )}
        {alternativeAction && (
          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 block mb-1">
              Alternative Option
            </span>
            <span className="leading-relaxed">{alternativeAction}</span>
          </div>
        )}
      </div>

      {/* Interactive Action Buttons */}
      {(onApprove || onAlternative) && (
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          {onAlternative && (
            <button
              onClick={onAlternative}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            >
              {alternativeText}
            </button>
          )}
          {onApprove && (
            <button
              onClick={onApprove}
              disabled={loading}
              className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all flex items-center gap-2 ${
                isCritical
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-glow-rose'
                  : 'bg-brand-600 hover:bg-brand-500 shadow-glow-indigo'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Processing...' : approveText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DecisionCard;
