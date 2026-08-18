import React, { useState, useEffect } from 'react';
import { AlertOctagon, X, CheckCircle, Brain, ArrowRight, ShieldAlert, FileText } from 'lucide-react';
import { exceptionApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const ExceptionResolutionModal = ({ exceptionId, isOpen, onClose, onResolved }) => {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (exceptionId && isOpen) {
      setLoading(true);
      exceptionApi
        .getResolutionOptions(exceptionId)
        .then((res) => {
          setData(res);
          if (res.recommended_option) {
            setSelectedAction(res.recommended_option.action_code);
          }
        })
        .catch((err) => {
          addToast(err.message, 'error');
        })
        .finally(() => setLoading(false));
    }
  }, [exceptionId, isOpen]);

  if (!isOpen) return null;

  const handleResolve = async () => {
    if (!selectedAction) {
      addToast('Please select a resolution action', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await exceptionApi.resolveException(exceptionId, {
        action_code: selectedAction,
        notes,
      });
      addToast('Exception resolved successfully and logged to audit ledger', 'success');
      if (onResolved) onResolved();
      onClose();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const exc = data?.exception;
  const options = data?.options || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-2xl rounded-3xl border border-rose-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-700/60 text-rose-400 shadow-glow-rose">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Exception Decision Wizard
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  #{exceptionId}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {exc?.exception_type?.replace(/_/g, ' ') || 'Warehouse Operational Exception'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading AI recovery options...</div>
          ) : (
            <>
              {/* Problem & Impact Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Problem & Affected Entity
                  </span>
                  <div className="font-semibold text-slate-200">
                    Order: <span className="font-mono text-brand-300">{exc?.order_number}</span>
                  </div>
                  <div className="text-slate-400 mt-0.5">SKU: {exc?.sku} ({exc?.product_name})</div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                    Operational Impact
                  </span>
                  <div>{exc?.impact_summary}</div>
                </div>
              </div>

              {/* AI Recommended Strategy */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-brand-500/40 shadow-glow-indigo">
                <div className="flex items-center gap-2 text-brand-300 font-bold uppercase tracking-wider text-xs mb-1.5">
                  <Brain className="w-4 h-4 text-brand-400 animate-pulse" />
                  <span>AI Recommended Recovery Decision</span>
                </div>
                <p className="text-slate-200 leading-relaxed text-xs">{exc?.ai_recommendation}</p>
              </div>

              {/* Select Resolution Action */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
                  Select Resolution Action to Execute:
                </label>
                <div className="space-y-2">
                  {options.map((opt) => {
                    const isSelected = selectedAction === opt.action_code;
                    return (
                      <div
                        key={opt.action_code}
                        onClick={() => setSelectedAction(opt.action_code)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-brand-600/20 border-brand-500 text-white shadow-glow-indigo'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-100">{opt.title}</span>
                          {isSelected && <CheckCircle className="w-4 h-4 text-brand-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{opt.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Supervisor Notes */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Supervisor Audit Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for audit compliance and warehouse ledger..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={submitting || loading}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-glow-emerald transition-all flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{submitting ? 'Applying Resolution...' : 'Authorize & Resolve'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExceptionResolutionModal;
