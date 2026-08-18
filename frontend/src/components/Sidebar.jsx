import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, GitBranch, Navigation,
  Box, CheckSquare, AlertOctagon, RefreshCw, BarChart3,
  Sliders, Bot, History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigationItems = [
  { name: 'Control Tower', path: '/', icon: LayoutDashboard, badge: 'Live' },
  { name: 'Order Operations', path: '/orders', icon: ShoppingCart },
  { name: 'Smart Allocation', path: '/allocation', icon: GitBranch, badge: 'AI' },
  { name: 'Inventory Intelligence', path: '/inventory', icon: Package },
  { name: 'Smart Picking', path: '/picking', icon: Navigation },
  { name: 'Packing Station', path: '/packing', icon: Box },
  { name: 'Quality Check', path: '/qc', icon: CheckSquare },
  { name: 'Exception Center', path: '/exceptions', icon: AlertOctagon, badgeColor: 'rose' },
  { name: 'Replenishment', path: '/replenishment', icon: RefreshCw },
  { name: 'Operational Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Scenario Simulator', path: '/simulator', icon: Sliders, badge: 'What-If' },
  { name: 'SmartFulfill Copilot', path: '/copilot', icon: Bot, badge: 'AI' },
  { name: 'Audit & Decisions', path: '/audit', icon: History },
];

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 min-h-[calc(100vh-61px)] flex flex-col justify-between p-3.5 flex-shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Operational Modules
        </div>

        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40 shadow-glow-indigo'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      item.badgeColor === 'rose'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                        : 'bg-brand-950 text-brand-300 border border-brand-800/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Decision Engine Status Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-brand-900/40 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
            Decision Engine
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
          Autonomous priority scoring, route optimization & bottleneck detection active.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
