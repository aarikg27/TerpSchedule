import React from 'react';
import { Calendar, Download, School } from 'lucide-react';
import type { RankedSchedule } from '../types/schedule';
import { getIcalDownloadUrl } from '../api/client';

interface NavbarProps {
  term: string;
  setTerm: (term: string) => void;
  activeSchedule: RankedSchedule | null;
  onOpenIngestModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  term,
  setTerm,
  activeSchedule,
  onOpenIngestModal,
}) => {
  const handleExportIcal = () => {
    if (!activeSchedule) return;
    const sectionCodes = activeSchedule.sections.map(
      (s) => `${s.course_id}-${s.section_id}`
    );
    const url = getIcalDownloadUrl(sectionCodes);
    window.open(url, '_blank');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 via-red-500 to-amber-400 p-0.5 shadow-lg shadow-red-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="font-black text-red-500 text-lg tracking-tighter">M</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white m-0">TerpSchedule</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60">
                UMD v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 m-0">Multi-Objective UMD Course Optimizer</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Term Selector */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              aria-label="Academic Term"
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="202608" className="bg-slate-900">Fall 2026</option>
              <option value="202601" className="bg-slate-900">Spring 2026</option>
              <option value="202508" className="bg-slate-900">Fall 2025</option>
            </select>
          </div>

          {/* Ingest button */}
          <button
            onClick={onOpenIngestModal}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
            title="Sync Course Data from Testudo"
          >
            <School className="w-3.5 h-3.5 text-red-400" />
            <span>Sync SOC</span>
          </button>

          {/* Export iCal */}
          <button
            onClick={handleExportIcal}
            disabled={!activeSchedule}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm ${
              activeSchedule
                ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-red-600/30 cursor-pointer'
                : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export .ics</span>
          </button>
        </div>
      </div>
    </header>
  );
};
