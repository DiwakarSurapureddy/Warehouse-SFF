import React from 'react';
import { CheckCircle2, Circle, Clock, AlertTriangle, ArrowRight, Truck } from 'lucide-react';

const STAGES = [
  { key: 'CREATED', label: 'Order Created', desc: 'Ingested & Parsed' },
  { key: 'PRIORITY_SCORED', label: 'Priority Scored', desc: 'AI Weighted Matrix' },
  { key: 'ALLOCATED', label: 'Allocated', desc: 'Smart Inventory Lock' },
  { key: 'PICKING', label: 'Picking', desc: 'TSP Route Sequence' },
  { key: 'PACKING', label: 'Packing', desc: 'Carton Fit & Label' },
  { key: 'QC', label: 'Quality Check', desc: '5-Point Verification' },
  { key: 'DISPATCHED', label: 'Dispatched', desc: 'Carrier Handover' },
];

const STAGE_ORDER = {
  CREATED: 0,
  PARTIALLY_ALLOCATED: 2,
  BACKORDERED: 2,
  ALLOCATED: 2,
  PICKING: 3,
  PICKED: 3,
  PACKING: 4,
  PACKED: 4,
  QC_PENDING: 5,
  QC_PASSED: 5,
  QC_FAILED: 5,
  DISPATCHED: 6,
  COMPLETED: 6,
};

const TimelineTracker = ({ status = 'CREATED', hasException = false, timestamps = {}, className = '' }) => {
  const currentStageIndex = STAGE_ORDER[status] !== undefined ? STAGE_ORDER[status] : 0;

  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Connecting background line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
        
        {/* Active colored line */}
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-brand-500 -translate-y-1/2 z-0 transition-all duration-500"
          style={{
            width: `${Math.min(100, (currentStageIndex / (STAGES.length - 1)) * 100)}%`,
          }}
        />

        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const isPending = idx > currentStageIndex;

          return (
            <div key={stage.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-brand-600 border-brand-500 text-white shadow-glow-indigo'
                    : isCurrent
                    ? hasException
                      ? 'bg-rose-600 border-rose-400 text-white shadow-glow-rose animate-bounce'
                      : 'bg-slate-900 border-brand-400 text-brand-300 shadow-glow-indigo ring-4 ring-brand-500/20'
                    : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isCurrent ? (
                  hasException ? (
                    <AlertTriangle className="w-4 h-4 text-white" />
                  ) : idx === STAGES.length - 1 ? (
                    <Truck className="w-4 h-4" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-ping" />
                  )
                ) : (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
              </div>

              <div className="mt-2 text-center">
                <span
                  className={`text-xs font-semibold block ${
                    isCurrent ? 'text-white font-bold' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {stage.label}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                  {stage.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineTracker;
