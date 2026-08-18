import React from 'react';

const statusConfig = {
  // Orders & Lifecycle
  CREATED: { label: 'Created', bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' },
  ALLOCATED: { label: 'Allocated', bg: 'bg-indigo-950/80', text: 'text-indigo-300', border: 'border-indigo-700/60' },
  PARTIALLY_ALLOCATED: { label: 'Partial Alloc', bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-700/60' },
  BACKORDERED: { label: 'Backordered', bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-700/60' },
  PICKING: { label: 'Picking', bg: 'bg-cyan-950/80', text: 'text-cyan-300', border: 'border-cyan-700/60' },
  PICKED: { label: 'Picked', bg: 'bg-teal-950/80', text: 'text-teal-300', border: 'border-teal-700/60' },
  PACKING: { label: 'Packing', bg: 'bg-blue-950/80', text: 'text-blue-300', border: 'border-blue-700/60' },
  PACKED: { label: 'Packed', bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-700/60' },
  QC_PENDING: { label: 'QC Pending', bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-700/60' },
  QC_PASSED: { label: 'QC Passed', bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-700/60' },
  QC_FAILED: { label: 'QC Failed', bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-700/60' },
  DISPATCHED: { label: 'Dispatched', bg: 'bg-emerald-950/90', text: 'text-emerald-200', border: 'border-emerald-600' },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-950/90', text: 'text-emerald-200', border: 'border-emerald-600' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-slate-900', text: 'text-slate-500', border: 'border-slate-800' },

  // Inventory Health
  HEALTHY: { label: 'Healthy', bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-800/60' },
  LOW_STOCK: { label: 'Low Stock', bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-800/60' },
  OUT_OF_STOCK: { label: 'Out of Stock', bg: 'bg-rose-950/80', text: 'text-rose-400', border: 'border-rose-800/80' },
  OVERSTOCK: { label: 'Overstock', bg: 'bg-indigo-950/60', text: 'text-indigo-400', border: 'border-indigo-800/60' },
  DAMAGED: { label: 'Damaged', bg: 'bg-rose-950/70', text: 'text-rose-300', border: 'border-rose-700/70' },
  MISSING: { label: 'Missing', bg: 'bg-amber-950/70', text: 'text-amber-300', border: 'border-amber-700/70' },

  // Exceptions & QC
  OPEN: { label: 'Open Issue', bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-700/80' },
  RESOLVED: { label: 'Resolved', bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-700/80' },
  IN_REVIEW: { label: 'In Review', bg: 'bg-blue-950/80', text: 'text-blue-300', border: 'border-blue-700/80' },
  PASS: { label: 'PASS', bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-600' },
  FAIL: { label: 'FAIL', bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-600' },
  HOLD: { label: 'HOLD', bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-600' },
};

const StatusBadge = ({ status, size = 'md', className = '' }) => {
  const norm = (status || 'CREATED').toUpperCase().replace(/ /g, '_');
  const cfg = statusConfig[norm] || { label: status, bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
