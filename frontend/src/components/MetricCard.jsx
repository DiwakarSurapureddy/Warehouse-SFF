import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MetricCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendLabel,
  trendPositive = true,
  glowColor = 'indigo', // indigo, rose, amber, emerald, cyan
  onClick,
  className = '',
}) => {
  const glowMap = {
    indigo: 'hover:border-indigo-500/50 hover:shadow-glow-indigo',
    rose: 'hover:border-rose-500/50 hover:shadow-glow-rose',
    amber: 'hover:border-amber-500/50 hover:shadow-glow-amber',
    emerald: 'hover:border-emerald-500/50 hover:shadow-glow-emerald',
    cyan: 'hover:border-cyan-500/50 hover:shadow-cyan-950/40',
  };

  const iconColorMap = {
    indigo: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/50',
    rose: 'text-rose-400 bg-rose-950/60 border-rose-800/50',
    amber: 'text-amber-400 bg-amber-950/60 border-amber-800/50',
    emerald: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50',
    cyan: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50',
  };

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-5 rounded-2xl transition-all duration-300 ${glowMap[glowColor]} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1.5 font-mono">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${iconColorMap[glowColor]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
        <div className="text-slate-400 truncate">{subtext}</div>
        {trend && (
          <div
            className={`flex items-center gap-1 font-medium font-mono ${
              trendPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trendPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{trend}</span>
            {trendLabel && <span className="text-slate-400 font-sans ml-0.5">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
