import React, { useRef, useState } from 'react';
import type { RankedSchedule, Section, Meeting } from '../types/schedule';
import { Star, MapPin, Clock, Footprints, Laptop, User, FlaskConical, Users, Presentation, X, ExternalLink, Navigation } from 'lucide-react';
import { useModalDialog } from '../hooks/useModalDialog';

interface CalendarGridProps {
  schedule: RankedSchedule | null;
  visibleMeetingTypes: string[];
  onVisibleMeetingTypesChange: (types: string[]) => void;
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
  CMSC: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-50 text-red-700' },
  MATH: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-50 text-indigo-700' },
  STAT: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-50 text-cyan-700' },
  ENGL: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700' },
  PHYS: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-50 text-purple-700' },
  BMGT: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700' },
  DEFAULT: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-50 text-slate-700' },
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

const normalizeMeetingType = (value?: string | null) => {
  const type = (value || '').toLowerCase();
  if (type.includes('discussion') || type.includes('recitation')) return 'Discussion';
  if (type.includes('lab')) return 'Lab';
  if (type.includes('lecture')) return 'Lecture';
  if (type.includes('online')) return 'Online';
  return 'Other';
};

const typeIcon = (type: string) => type === 'Lab' ? <FlaskConical className="w-2.5 h-2.5" /> : type === 'Discussion' ? <Users className="w-2.5 h-2.5" /> : <Presentation className="w-2.5 h-2.5" />;

export const CalendarGrid: React.FC<CalendarGridProps> = ({ schedule, visibleMeetingTypes, onVisibleMeetingTypesChange }) => {
  const [hoveredSection, setHoveredSection] = useState<{
    section: Section;
    meeting: Meeting;
    nextMeeting?: Meeting;
  } | null>(null);
  const [selectedSection, setSelectedSection] = useState<{ section: Section; meeting: Meeting } | null>(null);
  const detailsDialog = useRef<HTMLDivElement>(null);
  useModalDialog(detailsDialog, () => setSelectedSection(null), Boolean(selectedSection));

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
      } else if (inPersonMeetingsByDay[m.day] && visibleMeetingTypes.includes(normalizeMeetingType(m.class_type))) {
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
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2.5">
        <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Show on calendar</span>
        {['Lecture', 'Discussion', 'Lab', 'Online', 'Other'].map((type) => {
          const active = visibleMeetingTypes.includes(type);
          return <button key={type} type="button" onClick={() => onVisibleMeetingTypesChange(active ? visibleMeetingTypes.filter((item) => item !== type) : [...visibleMeetingTypes, type])} className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${active ? 'border-red-500/60 bg-red-950/50 text-red-200' : 'border-slate-800 bg-slate-950 text-slate-500'}`}>{type}</button>;
        })}
      </div>
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
                        onClick={() => setSelectedSection({ section, meeting })}
                        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedSection({ section, meeting }); }}
                        role="button"
                        tabIndex={0}
                        aria-label={`View ${section.course_id} section ${section.section_id} details`}
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
                        <div className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-300/80">
                          {typeIcon(normalizeMeetingType(meeting.class_type))}
                          <span>{normalizeMeetingType(meeting.class_type)}</span>
                          <span className={`ml-auto h-1.5 w-1.5 rounded-full ${section.open_seats > 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} title={section.open_seats > 0 ? `${section.open_seats} seats open` : 'Waitlist or closed'} />
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
            <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold ${getCourseColor(hoveredSection.section.course_id).bg} ${getCourseColor(hoveredSection.section.course_id).border} ${getCourseColor(hoveredSection.section.course_id).text}`}>
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
            <div className={`flex items-center gap-1 border px-2 py-1 rounded-md font-semibold font-mono ${getCourseColor(hoveredSection.section.course_id).badge} ${getCourseColor(hoveredSection.section.course_id).border}`}>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{hoveredSection.section.rating ? hoveredSection.section.rating.toFixed(1) : '3.0'} / 5.0</span>
            </div>

            {/* GPA */}
            <div className="bg-slate-800 border border-slate-700 px-2 py-1 rounded-md text-slate-200 font-mono font-semibold">
              GPA: {hoveredSection.section.gpa_available && hoveredSection.section.gpa != null ? hoveredSection.section.gpa.toFixed(2) : 'No data'}
            </div>

            {/* Walk buffer if next meeting exists */}
            {hoveredSection.meeting.next_building && (
              <div className="flex items-center gap-1 text-slate-400 font-mono">
                <Footprints className="w-3 h-3 text-purple-400" />
                <span>Next: {hoveredSection.meeting.next_course_id} · {hoveredSection.meeting.next_building}</span>
                {hoveredSection.meeting.walk_to_next_minutes != null && <strong className="text-slate-700">· {hoveredSection.meeting.walk_to_next_minutes} min walk</strong>}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedSection && (() => {
        const { section, meeting } = selectedSection;
        const colors = getCourseColor(section.course_id);
        const origin = meeting.building_latitude != null && meeting.building_longitude != null
          ? `${meeting.building_latitude},${meeting.building_longitude}`
          : meeting.building_name ? `${meeting.building_name}, University of Maryland, College Park` : null;
        const destination = meeting.next_building_latitude != null && meeting.next_building_longitude != null
          ? `${meeting.next_building_latitude},${meeting.next_building_longitude}`
          : meeting.next_building_name ? `${meeting.next_building_name}, University of Maryland, College Park` : null;
        const mapsUrl = origin && destination
          ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking`
          : null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedSection(null); }}>
            <div ref={detailsDialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${section.course_id} section details`} className="course-details-modal w-full max-w-lg overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-2xl outline-none">
              <div className={`border-b p-6 ${colors.bg} ${colors.border}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={`text-xs font-semibold uppercase tracking-[.16em] ${colors.text}`}>{normalizeMeetingType(meeting.class_type)} · Section {section.section_id}</div>
                    <h2 className={`mt-1 text-3xl font-semibold tracking-tight ${colors.text}`}>{section.course_id}</h2>
                  </div>
                  <button type="button" aria-label="Close details" onClick={() => setSelectedSection(null)} className="rounded-full bg-white/80 p-2 text-slate-700 shadow-sm"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-5 p-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4"><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Instructor</div><div className="mt-1 text-sm font-semibold text-slate-800">{section.instructor || 'TBA'}</div><div className="mt-1 text-xs text-slate-500">{section.rating ? section.rating.toFixed(1) : 'No'} rating · {section.gpa_available && section.gpa != null ? `${section.gpa.toFixed(2)} GPA` : 'No GPA data'}</div></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Meeting</div><div className="mt-1 text-sm font-semibold text-slate-800">{meeting.start}–{meeting.end}</div><div className="mt-1 text-xs text-slate-500">{meeting.building || 'TBA'} {meeting.room || ''}</div></div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-black/8 p-4">
                  <div><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Seats</div><div className={`mt-1 text-sm font-semibold ${section.open_seats > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{section.open_seats > 0 ? `${section.open_seats} of ${section.seats_total} open` : 'Waitlist or closed'}</div></div>
                  <div className="text-right text-xs text-slate-500">Waitlist count<br/><strong className="text-slate-800">{section.waitlist_count}</strong></div>
                </div>
                {meeting.next_building ? (
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-900"><Navigation className="w-4 h-4" /> Next: {meeting.next_course_id} in {meeting.next_building} {meeting.next_room || ''}</div>
                    <div className="mt-1 text-xs text-blue-700">Starts at {meeting.next_start} · estimated {meeting.walk_to_next_minutes ?? '—'} min ({meeting.walk_to_next_meters ? `${meeting.walk_to_next_meters} m` : 'distance unavailable'})</div>
                    {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-500">Open walking directions in Google Maps <ExternalLink className="w-3 h-3" /></a>}
                    <div className="mt-2 text-[10px] leading-relaxed text-blue-600/70">Campus estimate only. Google Maps provides current pedestrian routing.</div>
                  </div>
                ) : <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">No class follows this meeting on the same day.</div>}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
