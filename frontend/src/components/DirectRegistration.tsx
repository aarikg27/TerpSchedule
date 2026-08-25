import React, { useState } from 'react';
import type { RankedSchedule } from '../types/schedule';
import { Copy, Check, ExternalLink, Hash } from 'lucide-react';

interface DirectRegistrationProps {
  schedule: RankedSchedule | null;
}

export const DirectRegistration: React.FC<DirectRegistrationProps> = ({
  schedule,
}) => {
  const [copied, setCopied] = useState(false);

  if (!schedule) return null;

  const handleCopyAll = () => {
    const text = schedule.sections
      .map((s) => `${s.course_id}: ${s.section_id}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-red-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Registration Sections
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopyAll}
          className="flex items-center gap-1 text-[10px] font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy All</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-1.5">
        {schedule.sections.map((s) => (
          <div
            key={s.course_id}
            className="flex items-center justify-between bg-slate-950/70 border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-xs font-mono"
          >
            <span className="font-bold text-slate-200">{s.course_id}</span>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">Sec {s.section_id}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(s.section_id);
                }}
                className="text-slate-500 hover:text-slate-300"
                title={`Copy section ${s.section_id}`}
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-1 text-center">
        <a
          href="https://app.testudo.umd.edu/main/dropAdd.jsp"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-red-400 transition-colors"
        >
          <span>Open Testudo Drop/Add</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
