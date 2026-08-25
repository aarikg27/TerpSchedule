import React, { useState } from 'react';
import type { RankedSchedule, Section, Meeting } from '../types/schedule';
import { Star, MapPin, Clock, Footprints, Laptop, User } from 'lucide-react';

interface CalendarGridProps {
  schedule: RankedSchedule | null;
}

const DAYS = [
  { key: 'M', label: 'Monday' },
  { key: 'Tu', label: 'Tuesday' },
  { key: 'W', label: 'Wednesday' },
  { key: 'Th', label: 'Thursday' },
  { key: 'F', label: 'Friday' },
];

const START_MIN = 480; // 8:00 AM
const END_MIN = 1200;  // 8:00 PM
const TOTAL_MINUTES = END_MIN - START_MIN; // 720 min

const TIME_LABELS = [
  { label: '08:00 AM', min: 480 },
  { label: '09:00 AM', min: 540 },
  { label: '10:00 AM', min: 600 },
  { label: '11:00 AM', min: 660 },
  { label: '12:00 PM', min: 720 },
  { label: '01:00 PM', min: 780 },
  { label: '02:00 PM', min: 840 },
  { label: '03:00 PM', min: 900 },
  { label: '04:00 PM', min: 960 },
  { label: '05:00 PM', min: 1020 },
  { label: '06:00 PM', min: 1080 },
  { label: '07:00 PM', min: 1140 },
  { label: '08:00 PM', min: 1200 },
];

const COURSE_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  CMSC: { bg: 'bg-red-950/80', border: 'border-red-600/80', text: 'text-red-200', badge: 'bg-red-900/60 text-red-300' },
  MATH: { bg: 'bg-indigo-950/80', border: 'border-indigo-600/80', text: 'text-indigo-200', badge: 'bg-indigo-900/60 text-indigo-300' },
  STAT: { bg: 'bg-cyan-950/80', border: 'border-cyan-600/80', text: 'text-cyan-200', badge: 'bg-cyan-900/60 text-cyan-300' },
  ENGL: { bg: 'bg-amber-950/80', border: 'border-amber-600/80', text: 'text-amber-200', badge: 'bg-amber-900/60 text-amber-300' },
  PHYS: { bg: 'bg-purple-950/80', border: 'border-purple-600/80', text: 'text-purple-200', badge: 'bg-purple-900/60 text-purple-300' },
  BMGT: { bg: 'bg-emerald-950/80', border: 'border-emerald-600/80', text: 'text-emerald-200', badge: 'bg-emerald-900/60 text-emerald-300' },
  DEFAULT: { bg: 'bg-slate-850', border: 'border-slate-600', text: 'text-slate-200', badge: 'bg-slate-800 text-slate-300' },
};

function parseTimeToMin(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function getCourseColor(courseId: string) {
  const prefix = courseId.slice(0, 4).toUpperCase();
  return COURSE_COLORS[prefix] || COURSE_COLORS.DEFAULT;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ schedule }) => {
  const [hoveredSection, setHoveredSection] = useState<{
    section: Section;
    meeting: Meeting;
    nextMeeting?: Meeting;
  } | null>(null);

  if (!schedule) {
    return (
      <div className="h-full min-h-[550px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 p-8 text-center">
        <div className="h-14 w-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4 text-slate-500">
          <Clock className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-300 mb-1">No Schedule Generated</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Select your target UMD courses and click <strong>Generate Schedules</strong> to evaluate all conflict-free section combinations.
        </p>
      </div>
    );
  }

  // Separate online courses from in-person meetings
  const onlineSections: Section[] = [];
  const inPersonMeetingsByDay: Record<
    string,
    Array<{ section: Section; meeting: Meeting; nextMeeting?: Meeting }>
  > = { M: [], Tu: [], W: [], Th: [], F: [] };

  schedule.sections.forEach((sec) => {
    let hasInPerson = false;
    sec.meetings.forEach((m) => {
      if (m.day === 'ONLINE') {
        // online
      } else if (inPersonMeetingsByDay[m.day]) {
        inPersonMeetingsByDay[m.day].push({ section: sec, meeting: m });
        hasInPerson = true;
      }
    });
    if (!hasInPerson && sec.meetings.some((m) => m.day === 'ONLINE')) {
      onlineSections.push(sec);
    }
  });

  // Sort each day's meetings by start time and compute consecutive walk info
  DAYS.forEach((d) => {
    inPersonMeetingsByDay[d.key].sort((a, b) => {
      return parseTimeToMin(a.meeting.start) - parseTimeToMin(b.meeting.start);
    });
    for (let i = 0; i < inPersonMeetingsByDay[d.key].length - 1; i++) {
      inPersonMeetingsByDay[d.key][i].nextMeeting = inPersonMeetingsByDay[d.key][i + 1].meeting;
    }
  });

  return (
    <div className="space-y-3">
      {/* Online / Asynchronous Courses Bar */}
      {onlineSections.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Laptop className="w-3.5 h-3.5" />
            <span>Online / Async:</span>
          </div>
          {onlineSections.map((sec) => (
            <div
              key={`${sec.course_id}-${sec.section_id}`}
              className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md text-xs text-slate-200 flex items-center gap-2 font-mono"
            >
              <span className="font-bold text-amber-300">{sec.course_id}-{sec.section_id}</span>
              <span className="text-slate-400 text-[11px]">({sec.instructor || 'TBA'})</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Timetable Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-x-auto relative">
        <div className="min-w-[650px]">
          {/* Header Days */}
          <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-2 border-b border-slate-800 pb-2 mb-2 text-center">
            <div className="text-[11px] font-bold uppercase text-slate-500">Time</div>
            {DAYS.map((d) => (
              <div key={d.key} className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {d.label}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-2 relative h-[600px]">
            {/* Left Time Axis */}
            <div className="relative h-full text-right pr-2 select-none">
              {TIME_LABELS.map((t) => {
                const topPct = ((t.min - START_MIN) / TOTAL_MINUTES) * 100;
                return (
                  <div
                    key={t.min}
                    className="absolute right-2 -translate-y-1/2 text-[10px] font-mono text-slate-500 font-medium"
                    style={{ top: `${topPct}%` }}
                  >
                    {t.label.replace(':00 ', ' ')}
                  </div>
                );
              })}
            </div>

            {/* Day Columns */}
            {DAYS.map((d) => {
              const dayMeetings = inPersonMeetingsByDay[d.key] || [];
              return (
                <div
                  key={d.key}
                  className="relative h-full bg-slate-950/40 rounded-lg border border-slate-800/60 overflow-hidden"
                >
                  {/* Hour Guideline Lines */}
                  {TIME_LABELS.map((t) => {
                    const topPct = ((t.min - START_MIN) / TOTAL_MINUTES) * 100;
                    return (
                      <div
                        key={t.min}
                        className="absolute inset-x-0 border-t border-slate-800/40 pointer-events-none"
                        style={{ top: `${topPct}%` }}
                      />
                    );
                  })}

                  {/* Course Time Blocks */}
                  {dayMeetings.map(({ section, meeting, nextMeeting }) => {
                    const startMin = parseTimeToMin(meeting.start);
                    const endMin = parseTimeToMin(meeting.end);
                    const topPct = Math.max(0, ((startMin - START_MIN) / TOTAL_MINUTES) * 100);
                    const heightPct = Math.max(4, ((endMin - startMin) / TOTAL_MINUTES) * 100);
                    const colors = getCourseColor(section.course_id);

                    return (
                      <div
                        key={`${section.course_id}-${section.section_id}-${meeting.start}`}
                        onMouseEnter={() => setHoveredSection({ section, meeting, nextMeeting })}
                        onMouseLeave={() => setHoveredSection(null)}
                        className={`absolute inset-x-1 rounded-md border p-1.5 text-left transition-all cursor-pointer shadow-md overflow-hidden ${colors.bg} ${colors.border} hover:scale-[1.02] hover:z-20`}
                        style={{ top: `${topPct}%`, height: `${heightPct}%` }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-mono text-xs font-black truncate ${colors.text}`}>
                            {section.course_id}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {section.section_id}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300 font-medium truncate flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>{meeting.building ? `${meeting.building} ${meeting.room || ''}` : 'TBA'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {meeting.start} - {meeting.end}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating / Active Hover Details Card */}
      {hoveredSection && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-800 text-red-200 font-mono font-bold">
              {hoveredSection.section.course_id}-{hoveredSection.section.section_id}
            </div>
            <div>
              <div className="font-semibold text-slate-100 flex items-center gap-2">
                <User className="w-3 h-3 text-slate-400" />
                <span>Instructor: {hoveredSection.section.instructor || 'TBA'}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>Room: {hoveredSection.meeting.building || 'TBA'} {hoveredSection.meeting.room || ''}</span>
                <span>•</span>
                <span>{hoveredSection.meeting.start} – {hoveredSection.meeting.end}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* PlanetTerp rating */}
            <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-800/60 px-2 py-1 rounded-md text-amber-300 font-semibold font-mono">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{hoveredSection.section.rating ? hoveredSection.section.rating.toFixed(1) : '3.0'} / 5.0</span>
            </div>

            {/* GPA */}
            <div className="bg-slate-800 border border-slate-700 px-2 py-1 rounded-md text-slate-200 font-mono font-semibold">
              GPA: {hoveredSection.section.gpa ? hoveredSection.section.gpa.toFixed(2) : '3.00'}
            </div>

            {/* Walk buffer if next meeting exists */}
            {hoveredSection.nextMeeting && hoveredSection.nextMeeting.building && (
              <div className="flex items-center gap-1 text-slate-400 font-mono">
                <Footprints className="w-3 h-3 text-purple-400" />
                <span>Next: {hoveredSection.nextMeeting.building}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
