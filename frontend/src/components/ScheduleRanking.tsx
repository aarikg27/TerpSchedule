import React, { useEffect, useMemo, useState } from 'react';
import type { OptimizeResponse, RankedSchedule } from '../types/schedule';
import { CheckCircle2, Zap, Clock, Star, CircleCheck, ListPlus } from 'lucide-react';

interface ScheduleRankingProps {
  response: OptimizeResponse | null;
  activeSchedule: RankedSchedule | null;
  onSelectSchedule: (schedule: RankedSchedule) => void;
}

export const ScheduleRanking: React.FC<ScheduleRankingProps> = ({
  response,
  activeSchedule,
  onSelectSchedule,
}) => {
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'open' | 'waitlist'>('all');

  const visibleSchedules = useMemo(() => availabilityFilter === 'open'
    ? (response?.open_schedules || [])
    : availabilityFilter === 'waitlist'
      ? (response?.waitlist_schedules || [])
      : (response?.schedules || []), [availabilityFilter, response]);

  useEffect(() => {
    if (!activeSchedule?.customized && visibleSchedules.length && !visibleSchedules.some((item) => item.rank === activeSchedule?.rank)) {
      onSelectSchedule(visibleSchedules[0]);
    }
  }, [visibleSchedules, activeSchedule?.rank, activeSchedule?.customized, onSelectSchedule]);

  if (!response || response.schedules.length === 0) {
    return (
      <div className="p-4 border border-slate-800 rounded-xl bg-slate-900/40 text-center">
        <p className="text-xs text-slate-500">No schedules generated yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-950/60 p-1">
        {([
          ['all', 'All', response.valid_schedules_count],
          ['open', 'Open now', response.registerable_schedules_count],
          ['waitlist', 'Waitlist', response.waitlist_schedules_count],
        ] as const).map(([value, label, count]) => (
          <button key={value} type="button" onClick={() => setAvailabilityFilter(value)} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${availabilityFilter === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
            <span className="block">{label}</span><span className="font-mono text-[9px] opacity-60">{count.toLocaleString()}</span>
          </button>
        ))}
      </div>
      {/* Execution Stats Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Checked: <strong className="text-slate-200">{response.total_combinations_checked.toLocaleString()}</strong></span>
        </div>
        <div>
          <span>Valid: <strong className="text-emerald-400">{response.valid_schedules_count}</strong></span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" />
          <span title={`Algorithm: ${response.execution_time_ms.toFixed(1)}ms`}>Total: {response.total_request_time_ms == null ? `${response.execution_time_ms.toFixed(1)}ms` : response.total_request_time_ms >= 1000 ? `${(response.total_request_time_ms / 1000).toFixed(1)}s` : `${response.total_request_time_ms}ms`}</span>
        </div>
      </div>
      {/* Schedule List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1.5">
        {visibleSchedules.map((schedule, idx) => {
          const isActive = activeSchedule?.rank === schedule.rank;
          const { metrics } = schedule;
          const totalCredits = metrics.total_credits ?? schedule.sections.reduce((total, section) => total + (section.credits || 0), 0);
          const gpaCoverage = metrics.gpa_sections_with_data ?? schedule.sections.filter((section) => section.gpa_available).length;
          const gpaTotal = metrics.gpa_sections_total ?? schedule.sections.length;

          return (
            <button
              key={schedule.rank}
              type="button"
              onClick={() => onSelectSchedule(schedule)}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'schedule-card-active border-red-500 shadow-md ring-1 ring-red-500/20'
                  : 'schedule-card border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-md font-mono ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : idx === 2
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    #{schedule.rank}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-semibold text-red-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono font-bold text-white">
                    {schedule.total_score.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-500">/100</span>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-slate-400 mt-2">
                <div className="bg-slate-950/60 px-1.5 py-0.5 rounded flex items-center gap-1 truncate">
                  <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                  <span>{metrics.avg_professor_rating.toFixed(1)} ★</span>
                </div>
                <div className="bg-slate-950/60 px-1.5 py-0.5 rounded text-center truncate">
                  GPA: <span className="text-slate-200">{metrics.avg_gpa == null ? 'No data' : `${metrics.avg_gpa.toFixed(2)} (${gpaCoverage}/${gpaTotal})`}</span>
                </div>
                <div className="bg-slate-950/60 px-1.5 py-0.5 rounded text-center truncate" title={`${gpaCoverage} of ${gpaTotal} courses have GPA data`}>
                  <span className="text-slate-200">{totalCredits || '—'}</span> cr
                </div>
                <div className="bg-slate-950/60 px-1.5 py-0.5 rounded text-right truncate">
                  Gap: <span className="text-slate-200">{metrics.total_gap_minutes}m</span>
                </div>
              </div>
              <div className={`mt-2 flex items-center gap-1 text-[10px] font-semibold ${metrics.registerable_now ? 'text-emerald-400' : 'text-amber-400'}`}>
                {metrics.registerable_now ? <CircleCheck className="w-3 h-3" /> : <ListPlus className="w-3 h-3" />}
                {metrics.registerable_now ? 'All sections open — register now' : `${metrics.unavailable_sections} section${metrics.unavailable_sections === 1 ? '' : 's'} need waitlist or are closed`}
              </div>
            </button>
          );
        })}
        {visibleSchedules.length === 0 && <div className="rounded-xl border border-dashed border-slate-800 p-5 text-center text-xs text-slate-500">No top-ranked schedules match this view.</div>}
      </div>
    </div>
  );
};
