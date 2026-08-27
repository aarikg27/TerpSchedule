import React from 'react';
import { BookOpen, GraduationCap, Star, Users } from 'lucide-react';
import type { RankedSchedule } from '../types/schedule';
import { calculateMetrics } from '../utils/scheduleBuilder';

export const ScheduleSummary: React.FC<{ schedule: RankedSchedule }> = ({ schedule }) => {
  const metrics = calculateMetrics(schedule.sections);
  const rated = schedule.sections.filter((section) => section.rating != null && section.rating > 0).length;
  return (
    <section aria-label="Schedule summary" className="builder-summary grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-sm sm:grid-cols-4">
      <div className="rounded-xl bg-slate-950/40 p-3"><BookOpen className="mb-2 h-4 w-4 text-red-400"/><strong className="block text-lg text-slate-100">{metrics.total_credits}</strong><span className="text-[10px] text-slate-500">total credits</span></div>
      <div className="rounded-xl bg-slate-950/40 p-3"><GraduationCap className="mb-2 h-4 w-4 text-blue-400"/><strong className="block text-lg text-slate-100">{metrics.avg_gpa == null ? 'No data' : metrics.avg_gpa.toFixed(2)}</strong><span className="text-[10px] text-slate-500">average GPA · {metrics.gpa_sections_with_data}/{metrics.gpa_sections_total} with data</span></div>
      <div className="rounded-xl bg-slate-950/40 p-3"><Star className="mb-2 h-4 w-4 text-amber-400"/><strong className="block text-lg text-slate-100">{rated ? `${metrics.avg_professor_rating.toFixed(1)} / 5` : 'No data'}</strong><span className="text-[10px] text-slate-500">professor rating · {rated}/{schedule.sections.length} rated</span></div>
      <div className="rounded-xl bg-slate-950/40 p-3"><Users className="mb-2 h-4 w-4 text-emerald-400"/><strong className="block text-lg text-slate-100">{metrics.open_sections}/{schedule.sections.length}</strong><span className="text-[10px] text-slate-500">sections open now</span></div>
      {schedule.customized && <div className="col-span-2 text-[10px] font-medium text-slate-500 sm:col-span-4">Edited schedule</div>}
    </section>
  );
};
