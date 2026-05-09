import React from 'react';
import { ChevronRight } from 'lucide-react';

const TerminalLine = ({ line }) => {
  const t = String(line).replace(/\r$/, '');
  if (/^\s*#/.test(t)) {
    return <span className="text-slate-500">{t}</span>;
  }
  const m = t.match(/^(\s*)(\S+)(.*)$/);
  if (!m) return <span className="text-slate-200">{t}</span>;
  return (
    <>
      <span className="text-slate-500">{m[1]}</span>
      <span className="text-sky-400">{m[2]}</span>
      <span className="text-slate-100">{m[3]}</span>
    </>
  );
};

const QuickStartPanel = ({ text, className = '' }) => {
  if (!text || !String(text).trim()) return null;
  const lines = String(text).split('\n');

  return (
    <section
      className={`rounded-xl border border-border bg-surface shadow-card overflow-hidden ${className}`.trim()}
    >
      <h2 className="flex items-center gap-1 px-4 py-3.5 border-b border-border bg-surface-muted/40 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-800">
        <ChevronRight className="w-4 h-4 text-brand-700 -mr-0.5" strokeWidth={2.5} />
        Quick start
      </h2>
      <div className="p-3 sm:p-4 bg-[#0d1117] border-t border-slate-800/80">
        <div className="rounded-lg overflow-hidden ring-1 ring-slate-800/90 font-mono text-[11px] leading-[1.55] divide-y divide-slate-800/50">
          {lines.map((line, i) => (
            <div key={i} className="px-3 py-2">
              <TerminalLine line={line} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickStartPanel;
