import React, { useEffect, useState } from 'react';
import { Calendar, Download, Cloud, CheckCircle2, Settings, Sun, Moon, Monitor } from 'lucide-react';
import type { RankedSchedule } from '../types/schedule';
import { getIcalDownloadUrl } from '../api/client';
import { getSyncStatus, type SyncStatus } from '../api/client';

interface NavbarProps {
  term: string;
  activeSchedule: RankedSchedule | null;
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  term,
  activeSchedule,
  theme,
  onThemeChange,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    getSyncStatus().then(setSyncStatus).catch(() => setSyncStatus(null));
  }, []);
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
      <div className="max-w-[1500px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[13px] bg-red-600 flex items-center justify-center shadow-sm">
            <span className="font-black text-white text-lg tracking-tighter">M</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white m-0">TerpSchedule</h1>
            </div>
            <p className="text-xs text-slate-400 m-0">Build a semester that fits your life.</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300" title={`Testudo term ${term}`}>
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-100">Fall 2026</span>
            <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400">Current</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5" title={syncStatus?.last_course_sync ? `Last course refresh ${new Date(syncStatus.last_course_sync).toLocaleString()}` : 'Automatic data sync is starting'}>
            {syncStatus?.last_course_sync ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Cloud className="w-3.5 h-3.5 text-blue-500" />}
            <span>{syncStatus?.last_course_sync ? 'Data up to date' : 'Syncing automatically'}</span>
          </div>
          <div className="relative">
            <button type="button" aria-label="Appearance settings" onClick={() => setSettingsOpen((open) => !open)} className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-slate-600 hover:bg-slate-50">
              <Settings className="w-4 h-4" />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 top-11 z-50 w-44 rounded-2xl border border-black/10 bg-white p-2 shadow-2xl">
                <div className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Appearance</div>
                {([['light', 'Light', Sun], ['dark', 'Dark', Moon], ['system', 'System', Monitor]] as const).map(([value, label, Icon]) => (
                  <button key={value} type="button" onClick={() => { onThemeChange(value); setSettingsOpen(false); }} className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium ${theme === value ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>

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
