import React, { useState, useEffect } from 'react';
import {
  CheckSquare, CheckCircle2, XCircle, AlertTriangle, ShieldCheck,
  RefreshCw, Check, ArrowRight, UserCheck, AlertOctagon
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { qcApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const QualityCheckPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [checks, setChecks] = useState([]);
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [loading, setLoading] = useState(true);

  // 5-Point Checklist State
  const [skuVerified, setSkuVerified] = useState(true);
  const [quantityVerified, setQuantityVerified] = useState(true);
  const [conditionVerified, setConditionVerified] = useState(true);
  const [packagingVerified, setPackagingVerified] = useState(true);
  const [labelVerified, setLabelVerified] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchChecks = async () => {
    try {
      setLoading(true);
      const res = await qcApi.getChecks();
      setChecks(res.quality_checks || []);
      if (res.quality_checks && res.quality_checks.length > 0 && !selectedCheck) {
        const detail = await qcApi.getCheck(res.quality_checks[0].id);
        setSelectedCheck(detail.quality_check);
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecks();
  }, []);

  const handleSelectCheck = async (checkId) => {
    try {
      const res = await qcApi.getCheck(checkId);
      setSelectedCheck(res.quality_check);
      setSkuVerified(res.quality_check.checklist?.sku_verified ?? true);
      setQuantityVerified(res.quality_check.checklist?.quantity_verified ?? true);
      setConditionVerified(res.quality_check.checklist?.condition_verified ?? true);
      setPackagingVerified(res.quality_check.checklist?.packaging_verified ?? true);
      setLabelVerified(res.quality_check.checklist?.label_verified ?? true);
      setNotes(res.quality_check.notes || '');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSubmitResult = async (status) => {
    if (!selectedCheck) return;
    setSubmitting(true);
    try {
      await qcApi.submitResult(selectedCheck.id, {
        status,
        sku_verified: skuVerified,
        quantity_verified: quantityVerified,
        condition_verified: conditionVerified,
        packaging_verified: packagingVerified,
        label_verified: labelVerified,
        notes,
        user_id: user?.id,
      });
      addToast(
        status === 'PASS'
          ? `Order #${selectedCheck.order_number} passed QC and is ready for dispatch!`
          : `QC ${status} recorded. Exception created automatically!`,
        status === 'PASS' ? 'success' : 'error'
      );
      fetchChecks();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-brand-500/40 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center shadow-glow-indigo text-indigo-300">
            <CheckSquare className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Quality Inspection Station
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase font-mono">
                5-Point Validation
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Strict pre-dispatch verification. Failed inspections automatically spawn Exception Center workflows.
            </p>
          </div>
        </div>

        <button
          onClick={fetchChecks}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Queue */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Parcels Awaiting QC ({checks.length})
          </h3>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {checks.map((c) => {
              const isSelected = selectedCheck?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCheck(c.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-brand-500/60 shadow-glow-indigo'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-white">{c.order_number}</span>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                    <span>Inspector: {c.inspector_name}</span>
                    <span className="font-mono text-slate-500">
                      {c.checked_at ? new Date(c.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Inspection Form */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 lg:col-span-2 space-y-6">
          {selectedCheck ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-white">
                      QC Inspection: {selectedCheck.order_number}
                    </span>
                    <StatusBadge status={selectedCheck.status} />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Station Inspector: <strong className="text-brand-300">{user?.full_name || 'QC Lead'}</strong>
                  </p>
                </div>
              </div>

              {/* Verified Items */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  Package Manifest & SKU Breakdown
                </h4>
                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/80 divide-y divide-slate-800/60 text-xs">
                  {selectedCheck.order_items?.map((it) => (
                    <div key={it.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-brand-300">{it.sku}</div>
                        <div className="text-slate-200">{it.name}</div>
                      </div>
                      <div className="font-mono font-bold text-white">
                        {it.quantity_packed} units packed
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5-Point Verification Checklist */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3.5 text-xs">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider">
                  5-Point Physical Inspection Checklist
                </h4>

                <div className="space-y-2.5">
                  {[
                    { label: 'Correct SKU match against barcode scan', state: skuVerified, setter: setSkuVerified },
                    { label: 'Correct item quantity verified in parcel', state: quantityVerified, setter: setQuantityVerified },
                    { label: 'Product condition pristine (no cosmetic defects)', state: conditionVerified, setter: setConditionVerified },
                    { label: 'Packaging integrity intact & sealed securely', state: packagingVerified, setter: setPackagingVerified },
                    { label: 'Shipping label & carrier routing barcodes readable', state: labelVerified, setter: setLabelVerified },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => item.setter(!item.state)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        item.state
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                          : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                            item.state
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'bg-rose-600 border-rose-500 text-white'
                          }`}
                        >
                          {item.state ? <Check className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-semibold">{item.label}</span>
                      </div>
                      <span className="font-mono text-[11px] uppercase font-bold">
                        {item.state ? 'VERIFIED' : 'FAILED'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-slate-400 font-bold mb-1">
                    Inspector Notes / Defect Details
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter observation notes or failure reason..."
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Action Buttons: PASS, HOLD, FAIL */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleSubmitResult('HOLD')}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Place on Quality Hold</span>
                </button>

                <button
                  onClick={() => handleSubmitResult('FAIL')}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-glow-rose transition-all flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Fail QC & Spawn Exception</span>
                </button>

                <button
                  onClick={() => handleSubmitResult('PASS')}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-emerald transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pass QC & Authorize Dispatch</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a parcel from the queue to start quality inspection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QualityCheckPage;
