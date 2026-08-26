import React, { useState } from 'react';
import { SlidersHorizontal, Clock, CalendarOff, Hourglass, UserX, UserCheck, X } from 'lucide-react';
import type { Constraints } from '../types/schedule';

interface ConstraintPanelProps {
  constraints: Constraints;
  onChange: (constraints: Constraints) => void;
  selectedCourses: string[];
}

const TIME_OPTIONS = [
  { label: '08:00 AM', value: 480 },
  { label: '08:30 AM', value: 510 },
  { label: '09:00 AM', value: 540 },
  { label: '09:30 AM', value: 570 },
  { label: '10:00 AM', value: 600 },
  { label: '11:00 AM', value: 660 },
  { label: '12:00 PM', value: 720 },
  { label: '01:00 PM', value: 780 },
  { label: '02:00 PM', value: 840 },
  { label: '03:00 PM', value: 900 },
  { label: '04:00 PM', value: 960 },
  { label: '05:00 PM', value: 1020 },
  { label: '06:00 PM', value: 1080 },
  { label: '07:00 PM', value: 1140 },
  { label: '08:00 PM', value: 1200 },
  { label: '09:00 PM', value: 1260 },
  { label: '10:00 PM', value: 1320 },
];

const WEEKDAYS = [
  { label: 'Mon', value: 'M' },
  { label: 'Tue', value: 'Tu' },
  { label: 'Wed', value: 'W' },
  { label: 'Thu', value: 'Th' },
  { label: 'Fri', value: 'F' },
];

export const ConstraintPanel: React.FC<ConstraintPanelProps> = ({
  constraints,
  onChange,
  selectedCourses,
}) => {
  const [profInput, setProfInput] = useState('');
  const [wantedInput, setWantedInput] = useState('');
  const [wantedCourse, setWantedCourse] = useState(selectedCourses[0] || '');

  const handleToggleDay = (day: string) => {
    const isBlocked = constraints.blocked_days.includes(day);
    const newBlocked = isBlocked
      ? constraints.blocked_days.filter((d) => d !== day)
      : [...constraints.blocked_days, day];
    onChange({ ...constraints, blocked_days: newBlocked });
  };

  const handleAddAvoidProf = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && profInput.trim()) {
      e.preventDefault();
      const name = profInput.trim();
      if (!constraints.avoid_professors.includes(name)) {
        onChange({
          ...constraints,
          avoid_professors: [...constraints.avoid_professors, name],
        });
      }
      setProfInput('');
    }
  };

  const handleRemoveAvoidProf = (name: string) => {
    onChange({
      ...constraints,
      avoid_professors: constraints.avoid_professors.filter((p) => p !== name),
    });
  };

  const addWantedInstructor = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !wantedInput.trim() || !wantedCourse) return;
    e.preventDefault();
    const current = constraints.preferred_instructors[wantedCourse] || [];
    if (!current.includes(wantedInput.trim())) {
      onChange({ ...constraints, preferred_instructors: { ...constraints.preferred_instructors, [wantedCourse]: [...current, wantedInput.trim()] } });
    }
    setWantedInput('');
  };

  const removeWantedInstructor = (course: string, name: string) => {
    const next = { ...constraints.preferred_instructors };
    next[course] = (next[course] || []).filter((item) => item !== name);
    if (!next[course].length) delete next[course];
    onChange({ ...constraints, preferred_instructors: next });
  };

  return (
    <div className="space-y-4 pt-3 border-t border-slate-800">
      <div className="flex items-center gap-1.5">
        <SlidersHorizontal className="w-3.5 h-3.5 text-red-500" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Hard Constraints
        </span>
      </div>

      {/* Time Boundary */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Earliest Start</span>
          </label>
          <select
            value={constraints.earliest_start_time}
            onChange={(e) =>
              onChange({
                ...constraints,
                earliest_start_time: Number(e.target.value),
              })
            }
            aria-label="Earliest Start Time"
            className="w-full bg-slate-900 border border-slate-700/80 rounded-md px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-red-500"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value} className="bg-slate-900">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Latest End</span>
          </label>
          <select
            value={constraints.latest_end_time}
            onChange={(e) =>
              onChange({
                ...constraints,
                latest_end_time: Number(e.target.value),
              })
            }
            aria-label="Latest End Time"
            className="w-full bg-slate-900 border border-slate-700/80 rounded-md px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-red-500"
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t.value} value={t.value} className="bg-slate-900">
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Excluded / Blocked Days */}
      <div>
        <label className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
          <CalendarOff className="w-3 h-3 text-slate-500" />
          <span>Days Free (No Classes)</span>
        </label>
        <div className="grid grid-cols-5 gap-1">
          {WEEKDAYS.map((d) => {
            const isBlocked = constraints.blocked_days.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => handleToggleDay(d.value)}
                className={`py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                  isBlocked
                    ? 'bg-red-900/60 border-red-600 text-white shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Max Gap */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Hourglass className="w-3 h-3 text-slate-500" />
            <span>Max Gap Between Classes</span>
          </label>
          <span className="text-xs font-mono text-amber-400 font-semibold">
            {constraints.max_gap_minutes === null
              ? 'Any'
              : `${Math.floor(constraints.max_gap_minutes / 60)}h ${constraints.max_gap_minutes % 60}m`}
          </span>
        </div>
        <input
          type="range"
          min="30"
          max="360"
          step="30"
          value={constraints.max_gap_minutes ?? 360}
          onChange={(e) =>
            onChange({
              ...constraints,
              max_gap_minutes: Number(e.target.value) === 360 ? null : Number(e.target.value),
            })
          }
          className="w-full accent-red-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>30m</span>
          <span>1h 30m</span>
          <span>3h</span>
          <span>Any</span>
        </div>
      </div>

      {/* Target Campus Days */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-[11px] font-medium text-slate-400">
            Target Active Days / Week
          </label>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            {constraints.target_campus_days} days
          </span>
        </div>
        <div className="flex gap-1.5">
          {[2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() =>
                onChange({ ...constraints, target_campus_days: num })
              }
              className={`flex-1 py-1 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                constraints.target_campus_days === num
                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {num}d
            </button>
          ))}
        </div>
      </div>

      {/* Avoid Professors */}
      <div>
        <label className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
          <UserX className="w-3 h-3 text-slate-500" />
          <span>Avoid Instructors</span>
        </label>
        <input
          type="text"
          value={profInput}
          onChange={(e) => setProfInput(e.target.value)}
          onKeyDown={handleAddAvoidProf}
          placeholder="Type instructor name & Enter..."
          className="w-full bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
        />
        {constraints.avoid_professors.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {constraints.avoid_professors.map((prof) => (
              <span
                key={prof}
                className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 text-[11px] px-2 py-0.5 rounded"
              >
                <span>{prof}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAvoidProf(prof)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
          <UserCheck className="w-3 h-3 text-emerald-400" /> <span>Require an Instructor</span>
        </label>
        <div className="grid grid-cols-[90px_1fr] gap-1.5">
          <select value={wantedCourse} onChange={(e) => setWantedCourse(e.target.value)} className="rounded-md border border-slate-700/80 bg-slate-900 px-2 py-1.5 text-xs text-slate-200">
            {!selectedCourses.length && <option value="">Course</option>}
            {selectedCourses.map((course) => <option key={course} value={course}>{course}</option>)}
          </select>
          <input type="text" value={wantedInput} onChange={(e) => setWantedInput(e.target.value)} onKeyDown={addWantedInstructor} disabled={!selectedCourses.length} placeholder="Exact name & Enter" className="rounded-md border border-slate-700/80 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50" />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(constraints.preferred_instructors).flatMap(([course, names]) => names.map((name) => (
            <span key={`${course}-${name}`} className="inline-flex items-center gap-1 rounded border border-emerald-800 bg-emerald-950/50 px-2 py-0.5 text-[10px] text-emerald-200">
              <strong>{course}</strong> {name}<button type="button" onClick={() => removeWantedInstructor(course, name)}><X className="w-3 h-3" /></button>
            </span>
          )))}
        </div>
      </div>
    </div>
  );
};
