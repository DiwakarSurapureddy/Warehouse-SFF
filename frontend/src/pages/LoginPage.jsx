import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ShieldCheck, UserCheck, ArrowRight, Sparkles, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, demoSwitchRole, roles } = useAuth();
  const { addToast } = useToast();

  const [username, setUsername] = useState('manager');
  const [password, setPassword] = useState('manager123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      addToast('Login successful', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (roleKey) => {
    setLoading(true);
    try {
      await demoSwitchRole(roleKey);
      addToast(`Logged in as Demo ${roleKey.toUpperCase()}`, 'success');
      navigate('/');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-glow-indigo text-white mx-auto">
            <Zap className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            SmartFulfill AI
          </h1>
          <p className="text-xs text-slate-400">
            Intelligent Warehouse Operations & Decision Intelligence Platform
          </p>
        </div>

        {/* 1-Click Demo Role Selection for Judges */}
        <div className="glass-panel p-5 rounded-3xl border border-brand-500/30 shadow-2xl space-y-3">
          <div className="flex items-center gap-2 text-brand-300 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Judge / Evaluator 1-Click Logins:</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.values(roles).map((r) => (
              <button
                key={r.key}
                onClick={() => handleDemoClick(r.key)}
                disabled={loading}
                className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-brand-950 hover:border-brand-500/60 border border-slate-800 text-left transition-all group"
              >
                <div className="font-bold text-white group-hover:text-brand-300 flex items-center justify-between">
                  <span>{r.label.split(' ')[0]}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-400" />
                </div>
                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">Role: {r.key}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-brand-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-brand-500 font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-glow-indigo transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Operations Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
