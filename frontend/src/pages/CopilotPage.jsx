import React, { useState, useEffect } from 'react';
import {
  Bot, Send, Sparkles, Zap, Database, ArrowRight, ShieldCheck,
  CheckCircle2, AlertTriangle, Layers, MessageSquare
} from 'lucide-react';
import { copilotApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const EXAMPLE_QUERIES = [
  'Which orders should we process first?',
  'Which products are at stockout risk?',
  'Why is fulfillment slow today?',
  'What active exceptions need attention?',
  'What is our current warehouse capacity and utilization?',
];

const CopilotPage = () => {
  const { addToast } = useToast();

  const [messages, setMessages] = useState([
    {
      sender: 'copilot',
      text: "👋 Welcome to **SmartFulfill Copilot**. I am an AI operations copilot directly grounded in your live warehouse SQLite database and decision engines.\n\nAsk me anything about prioritized order queues, inventory depletion risks, packing bottlenecks, or supervisor resolution recommendations.",
      data_source: 'SmartFulfill Operations Engine',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState(null);

  useEffect(() => {
    copilotApi.getContext().then((res) => {
      setContextData(res.context || {});
    });
  }, []);

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await copilotApi.queryCopilot(textToSend);
      const botMsg = {
        sender: 'copilot',
        text: res.answer,
        actionable_suggestion: res.actionable_suggestion,
        data_source: res.data_source,
        related_link: res.related_link,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'copilot', text: 'Error connecting to operations telemetry: ' + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-brand-500/40 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/30 border border-brand-500/50 flex items-center justify-center shadow-glow-indigo text-brand-300">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                SmartFulfill Operations Copilot
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-950 text-brand-300 border border-brand-800 uppercase font-mono">
                Database Grounded
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Natural language intelligence linked to active orders, inventory allocations, and station queue telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Tracking {contextData?.total_orders || 54} Orders • {contextData?.open_exceptions_count || 3} Exceptions</span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Quick Query Suggestions & Telemetry Sidebar */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Operational Prompt Starters
          </h3>

          <div className="space-y-2">
            {EXAMPLE_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-brand-950/40 hover:border-brand-500/40 text-slate-300 hover:text-white border border-slate-800/80 text-xs transition-all flex items-start gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-400 mt-0.5 flex-shrink-0" />
                <span className="leading-snug">{q}</span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
            <span className="font-bold text-slate-300 uppercase block text-[10px]">
              Active Grounding Context:
            </span>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono space-y-1">
              <div>SLA Risk Orders: <strong className="text-rose-400">{contextData?.sla_risk_count || 0}</strong></div>
              <div>Low Stock SKUs: <strong className="text-amber-400">{contextData?.low_stock_count || 0}</strong></div>
              <div>Open Exceptions: <strong className="text-rose-300">{contextData?.open_exceptions_count || 0}</strong></div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Chat Feed */}
        <div className="glass-panel rounded-3xl border border-slate-800 lg:col-span-3 flex flex-col h-[650px] overflow-hidden shadow-2xl">
          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-4 rounded-2xl max-w-[80%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none shadow-glow-indigo'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-none shadow-card-dark'
                  }`}
                >
                  <div className="whitespace-pre-line leading-relaxed">{m.text}</div>
                  {m.actionable_suggestion && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-start gap-2 text-xs text-brand-300 font-medium">
                      <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>{m.actionable_suggestion}</span>
                    </div>
                  )}
                </div>

                {m.data_source && (
                  <span className="text-[10px] text-slate-500 font-mono mt-1 px-2">
                    Verified against: {m.data_source}
                  </span>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 p-4 text-xs text-brand-400 italic">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-ping" />
                Querying live SQLite database & running operational decision models...
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask warehouse operations (e.g. 'Why is packing delayed?' or 'Which SKUs need reorder?')..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-xs shadow-glow-indigo transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Query</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CopilotPage;
