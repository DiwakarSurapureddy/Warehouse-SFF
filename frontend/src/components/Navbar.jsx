import React, { useState, useEffect } from 'react';
import {
  Bell, Search, Warehouse as WarehouseIcon, UserCheck, ShieldCheck,
  Zap, Check, ExternalLink, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWarehouse } from '../context/WarehouseContext';
import { notificationApi } from '../services/api';

const Navbar = ({ onOpenCopilot }) => {
  const { user, demoSwitchRole, roles } = useAuth();
  const { selectedWarehouseId, setSelectedWarehouseId } = useWarehouse();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await notificationApi.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="glass-header sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
      {/* Left: Brand / Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-glow-indigo">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-brand-300">
                SmartFulfill
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                AI Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden md:block">
              Warehouse Operations & Decision Intelligence
            </p>
          </div>
        </div>

        {/* Global Warehouse Selector */}
        <div className="hidden lg:flex items-center ml-4 pl-4 border-l border-slate-800">
          <WarehouseIcon className="w-4 h-4 text-slate-400 mr-2" />
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
          >
            <option value={1}>WH-A: Central Hub (Chicago, IL)</option>
            <option value={2}>WH-B: Pacific Express (Reno, NV)</option>
            <option value={3}>WH-C: Atlantic Regional (Newark, NJ)</option>
          </select>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Ask Copilot Button */}
        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600/30 to-indigo-600/30 border border-brand-500/50 text-brand-200 hover:text-white hover:border-brand-400 text-xs font-semibold shadow-glow-indigo transition-all"
        >
          <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
          <span className="hidden sm:inline">Ask Copilot</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel border border-slate-800 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Alert Center</span>
                  {unreadCount > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-brand-400 hover:text-brand-300 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No active notifications. All operations nominal.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition-colors hover:bg-slate-800/40 ${
                        !n.is_read ? 'bg-brand-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`font-semibold ${
                            n.severity === 'CRITICAL'
                              ? 'text-rose-400'
                              : n.severity === 'WARNING'
                              ? 'text-amber-400'
                              : 'text-brand-300'
                          }`}
                        >
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                          {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Demo Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-brand-300">{user?.full_name || 'Marcus Vance'}</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {user?.role || 'manager'}
            </span>
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel border border-slate-800 shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Operational Persona
              </div>
              <div className="space-y-1 mt-1">
                {Object.values(roles).map((r) => {
                  const isCurrent = user?.role === r.key;
                  return (
                    <button
                      key={r.key}
                      onClick={() => {
                        demoSwitchRole(r.key);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-brand-600/20 text-brand-200 font-bold border border-brand-500/40'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <span>{r.label}</span>
                      {isCurrent && <Check className="w-4 h-4 text-brand-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
