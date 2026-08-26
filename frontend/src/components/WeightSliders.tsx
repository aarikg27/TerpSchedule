import React, { useState } from 'react';
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
  professor_quality: { label: 'Instructor quality', hint: 'Ratings and historical GPA', icon: <Award className="w-4 h-4" />, accent: 'text-amber-500' },
  compactness: { label: 'Compact schedule', hint: 'Less idle time between classes', icon: <Minimize2 className="w-4 h-4" />, accent: 'text-sky-500' },
  campus_days: { label: 'Campus days', hint: 'Stay close to your target days', icon: <MapPin className="w-4 h-4" />, accent: 'text-emerald-500' },
  transit_ease: { label: 'Easy walks', hint: 'More time between buildings', icon: <Footprints className="w-4 h-4" />, accent: 'text-violet-500' },
};

export const WeightSliders: React.FC<PreferenceRankingProps> = ({ ranking, onChange, onGenerate, loading, disabled }) => {
  const [dragged, setDragged] = useState<PreferenceCriterion | null>(null);

  const commitOrder = (items: PreferenceRank[]) => {
    const update = () => onChange(items.map((item, index) => ({ ...item, rank: index + 1 })));
    const documentWithTransitions = document as Document & { startViewTransition?: (callback: () => void) => void };
    documentWithTransitions.startViewTransition ? documentWithTransitions.startViewTransition(update) : update();
  };

  const moveTo = (criterion: PreferenceCriterion, targetIndex: number) => {
    const from = ranking.findIndex((item) => item.criterion === criterion);
    if (from < 0 || from === targetIndex) return;
    const next = [...ranking];
    const [item] = next.splice(from, 1);
    next.splice(targetIndex, 0, item);
    commitOrder(next);
  };

  return (
    <div className="space-y-4 pt-5 border-t border-white/8">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Trophy className="w-4 h-4 text-amber-500" /> Rank your preferences
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">Drag to reorder, or choose a position. Every priority is unique.</p>
      </div>
      <div className="space-y-2">
        {ranking.map((item, index) => {
          const option = OPTIONS[item.criterion];
          return (
            <div
              key={item.criterion}
              draggable
              onDragStart={() => setDragged(item.criterion)}
              onDragEnd={() => setDragged(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => { if (dragged) moveTo(dragged, index); setDragged(null); }}
              style={{ viewTransitionName: `preference-${item.criterion}` }}
              className={`flex items-center gap-2.5 rounded-2xl border bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${dragged === item.criterion ? 'border-blue-400 opacity-60' : 'border-black/8'}`}
            >
              <GripVertical className="w-4 h-4 cursor-grab text-slate-400 active:cursor-grabbing" />
              <div className={option.accent}>{option.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-800">{option.label}</div>
                <div className="truncate text-[10px] text-slate-500">{option.hint}</div>
              </div>
              <select aria-label={`${option.label} priority`} value={index + 1} onChange={(event) => moveTo(item.criterion, Number(event.target.value) - 1)} className="h-8 w-[62px] rounded-full border border-black/10 bg-slate-50 px-2 text-xs font-semibold text-slate-800 outline-none">
                {[1, 2, 3, 4].map((rank) => <option key={rank} value={rank}>#{rank}</option>)}
              </select>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={onGenerate} disabled={disabled || loading} className="w-full rounded-full bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
        <span className="flex items-center justify-center gap-2">
          {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Building schedules…' : 'Generate schedules'}
        </span>
      </button>
    </div>
  );
};
