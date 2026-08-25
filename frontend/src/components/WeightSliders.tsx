import React from 'react';
import { Award, Footprints, GripVertical, MapPin, Minimize2, Sparkles, Trophy } from 'lucide-react';
import type { PreferenceCriterion, PreferenceRank } from '../types/schedule';

interface PreferenceRankingProps {
  ranking: PreferenceRank[];
  onChange: (ranking: PreferenceRank[]) => void;
  onGenerate: () => void;
  loading: boolean;
  disabled: boolean;
}

const OPTIONS: Record<PreferenceCriterion, { label: string; hint: string; icon: React.ReactNode; accent: string }> = {
  professor_quality: { label: 'Instructor quality', hint: 'Ratings and historical GPA', icon: <Award className="w-4 h-4" />, accent: 'text-amber-300' },
  compactness: { label: 'Compact schedule', hint: 'Less idle time between classes', icon: <Minimize2 className="w-4 h-4" />, accent: 'text-cyan-300' },
  campus_days: { label: 'Campus days', hint: 'Stay close to your target days', icon: <MapPin className="w-4 h-4" />, accent: 'text-emerald-300' },
  transit_ease: { label: 'Easy walks', hint: 'More time between buildings', icon: <Footprints className="w-4 h-4" />, accent: 'text-violet-300' },
};

export const WeightSliders: React.FC<PreferenceRankingProps> = ({ ranking, onChange, onGenerate, loading, disabled }) => {
  const setRank = (criterion: PreferenceCriterion, rank: number) => {
    onChange(ranking.map((item) => item.criterion === criterion ? { ...item, rank } : item));
  };

  return (
    <div className="space-y-4 pt-4 border-t border-white/8">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
          <Trophy className="w-4 h-4 text-amber-300" /> Rank your preferences
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          Pick a priority from 1–4. Give multiple preferences the same number to treat them equally.
        </p>
      </div>
      <div className="space-y-2">
        {ranking.map((item) => {
          const option = OPTIONS[item.criterion];
          return (
            <div key={item.criterion} className="group flex items-center gap-2.5 rounded-xl border border-white/8 bg-slate-950/55 p-2.5 hover:border-white/15 transition-colors">
              <GripVertical className="w-3.5 h-3.5 text-slate-700" />
              <div className={option.accent}>{option.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-200">{option.label}</div>
                <div className="truncate text-[10px] text-slate-500">{option.hint}</div>
              </div>
              <select aria-label={`${option.label} priority`} value={item.rank} onChange={(event) => setRank(item.criterion, Number(event.target.value))} className="h-8 w-[72px] rounded-lg border border-white/10 bg-slate-900 px-2 text-xs font-bold text-white outline-none focus:border-red-400">
                {[1, 2, 3, 4].map((rank) => <option key={rank} value={rank}>#{rank}</option>)}
              </select>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={onGenerate} disabled={disabled || loading} className="w-full rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-400 px-4 py-3.5 text-sm font-black text-white shadow-[0_14px_35px_-12px_rgba(239,68,68,.8)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none">
        <span className="flex items-center justify-center gap-2">
          {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Building your best schedules…' : 'Generate schedules'}
        </span>
      </button>
    </div>
  );
};
