import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import type { RankedSchedule } from '../types/schedule';

interface ScheduleRadarProps {
  schedule: RankedSchedule | null;
}

export const ScheduleRadar: React.FC<ScheduleRadarProps> = ({ schedule }) => {
  if (!schedule) {
    return (
      <div className="h-44 flex items-center justify-center border border-slate-800/80 rounded-xl bg-slate-900/40 text-slate-500 text-xs">
        No schedule selected
      </div>
    );
  }

  const { metrics } = schedule;

  // Normalized dimensions [0 - 100]
  const profScore = Math.min(
    100,
    Math.round(
      (0.6 * (metrics.avg_professor_rating / 5.0) +
        0.4 * (metrics.avg_gpa / 4.0)) *
        100
    )
  );

  const compactnessScore = Math.max(
    0,
    Math.round((1.0 - Math.min(1.0, metrics.total_gap_minutes / 600.0)) * 100)
  );

  const walkScore = Math.max(
    0,
    Math.round((1.0 - Math.min(1.0, metrics.max_walk_time_mins / 20.0)) * 100)
  );

  const daysScore = Math.max(
    0,
    Math.round((1.0 - Math.abs(metrics.active_days - 4) / 5.0) * 100)
  );

  const data = [
    { subject: 'Prof Quality', value: profScore },
    { subject: 'Compactness', value: compactnessScore },
    { subject: 'Walk Ease', value: walkScore },
    { subject: 'Days Match', value: daysScore },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Optimization Radar
        </span>
        <span className="text-xs font-mono font-bold text-red-400">
          Rank #{schedule.rank}
        </span>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="70%">
            <PolarGrid stroke="#334155" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            />
            <Radar
              name="Schedule Balance"
              dataKey="value"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown stat pills */}
      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono mt-1">
        <div className="bg-slate-950/60 border border-slate-800/80 px-2 py-1 rounded flex justify-between">
          <span className="text-slate-400">Prof Quality:</span>
          <span className="text-amber-400 font-bold">{profScore}%</span>
        </div>
        <div className="bg-slate-950/60 border border-slate-800/80 px-2 py-1 rounded flex justify-between">
          <span className="text-slate-400">Compactness:</span>
          <span className="text-cyan-400 font-bold">{compactnessScore}%</span>
        </div>
        <div className="bg-slate-950/60 border border-slate-800/80 px-2 py-1 rounded flex justify-between">
          <span className="text-slate-400">Walk Ease:</span>
          <span className="text-purple-400 font-bold">{walkScore}%</span>
        </div>
        <div className="bg-slate-950/60 border border-slate-800/80 px-2 py-1 rounded flex justify-between">
          <span className="text-slate-400">Days Match:</span>
          <span className="text-emerald-400 font-bold">{daysScore}%</span>
        </div>
      </div>
    </div>
  );
};
