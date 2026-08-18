import React, { useState } from 'react';
import { Bot, Sparkles, Send, X, ExternalLink, Zap } from 'lucide-react';
import { copilotApi } from '../services/api';

const PROMPT_SUGGESTIONS = [
  'Which orders should we process first?',
  'Which products are at stockout risk?',
  'Why is fulfillment slow today?',
  'What active exceptions need attention?',
];

const FloatingCopilotWidget = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'copilot',
      text: 'Hello! I am **SmartFulfill Copilot**, grounded in your live warehouse database. Ask me about prioritized orders, stockout risks, active bottlenecks, or exception resolutions.',
      suggestion: 'Click any suggested query below or type your operational question.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
        { sender: 'copilot', text: 'Error connecting to operations intelligence: ' + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 sm:w-[420px] glass-panel rounded-3xl border border-brand-500/40 shadow-2xl overflow-hidden flex flex-col h-[520px] animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-600/30 border border-brand-500/50 text-brand-300">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>SmartFulfill Copilot</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-800">
                Grounded
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">Live operational decision assistant</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-brand-600 text-white rounded-br-none shadow-glow-indigo'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>
              {m.actionable_suggestion && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-start gap-1.5 text-[11px] text-brand-300">
                  <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span>{m.actionable_suggestion}</span>
                </div>
              )}
            </div>
            {m.data_source && (
              <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">
                Grounding: {m.data_source}
              </span>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 p-3 text-xs text-brand-400 italic">
            <div className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
            Analyzing warehouse records & decision models...
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/60 overflow-x-auto flex gap-1.5 scrollbar-none">
        {PROMPT_SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-900 hover:bg-brand-950 hover:text-brand-300 border border-slate-800 text-slate-300 whitespace-nowrap transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask warehouse operations..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white shadow-glow-indigo transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default FloatingCopilotWidget;
