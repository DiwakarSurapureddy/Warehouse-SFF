import React from 'react';
import { Flame, AlertCircle, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';

const priorityConfig = {
  CRITICAL: {
    label: 'Critical',
    bg: 'bg-rose-950/80',
    text: 'text-rose-300',
    border: 'border-rose-600',
    icon: Flame,
    glow: 'shadow-glow-rose',
  },
  URGENT: {
    label: 'Urgent',
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    border: 'border-amber-600',
    icon: AlertCircle,
    glow: 'shadow-glow-amber',
  },
  HIGH: {
    label: 'High',
    bg: 'bg-orange-950/70',
    text: 'text-orange-300',
    border: 'border-orange-600/70',
    icon: ArrowUp,
    glow: '',
  },
  NORMAL: {
    label: 'Normal',
    bg: 'bg-slate-800/80',
    text: 'text-slate-300',
    border: 'border-slate-700',
    icon: ArrowRight,
    glow: '',
  },
  LOW: {
    label: 'Low',
    bg: 'bg-slate-900',
    text: 'text-slate-400',
    border: 'border-slate-800',
    icon: ArrowDown,
    glow: '',
  },
};

const PriorityBadge = ({ priority, score, showScore = false, className = '' }) => {
  const norm = (priority || 'NORMAL').toUpperCase();
  const cfg = priorityConfig[norm] || priorityConfig.NORMAL;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} ${cfg.glow} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{cfg.label}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 px-1.5 py-0.2 bg-black/40 rounded text-[11px] font-mono">
          {Math.round(score)}
        </span>
      )}
    </span>
  );
};

export default PriorityBadge;
