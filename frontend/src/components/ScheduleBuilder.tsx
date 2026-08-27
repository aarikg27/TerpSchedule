import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Plus, Search, Trash2, X } from 'lucide-react';
import { getCourseDetail, searchCourses } from '../api/client';
import type { CourseDetail, CourseSearchResult, RankedSchedule, Section } from '../types/schedule';
import { conflictingSections, customizeSchedule } from '../utils/scheduleBuilder';

interface Props { schedule: RankedSchedule | null; term: string; onChange: (schedule: RankedSchedule) => void }

const dayLabel = (day: string) => ({ M: 'Mon', Tu: 'Tue', W: 'Wed', Th: 'Thu', F: 'Fri', ONLINE: 'Online' }[day] || day);

export const ScheduleBuilder: React.FC<Props> = ({ schedule, term, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CourseSearchResult[]>([]);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ candidate: Section; conflicts: Section[]; sameCourse?: Section } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (query.trim().length < 2) return setResults([]);
      try { setResults((await searchCourses(query, term)).slice(0, 8)); } catch { setResults([]); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, term]);

  const chooseCourse = async (result: CourseSearchResult) => {
    setLoading(true); setError(null); setResults([]); setQuery(result.course_id);
    try { setCourse(await getCourseDetail(result.course_id, term)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load sections.'); }
    finally { setLoading(false); }
  };

  const asSection = (detail: CourseDetail, raw: CourseDetail['sections'][number]): Section => ({
    course_id: raw.course_id,
    section_id: raw.section_id,
    instructor: raw.instructor,
    rating: raw.avg_rating,
    gpa: raw.avg_gpa,
    gpa_available: raw.avg_gpa != null,
    credits: detail.credits,
    seats_total: raw.seats_total,
    open_seats: raw.open_seats,
    waitlist_count: raw.waitlist_count,
    availability: raw.open_seats > 0 ? 'open' : 'waitlist_or_closed',
    meetings: raw.meetings.map((meeting) => ({ day: meeting.day, start: meeting.start_time, end: meeting.end_time, building: meeting.building, room: meeting.room, class_type: meeting.class_type })),
  });

  const requestAdd = (candidate: Section) => {
    const current = schedule?.sections || [];
    if (current.some((section) => section.course_id === candidate.course_id && section.section_id === candidate.section_id)) {
      setError(`${candidate.course_id} section ${candidate.section_id} is already on this schedule.`);
      return;
    }
    const sameCourse = current.find((section) => section.course_id === candidate.course_id);
    const withoutSame = current.filter((section) => section !== sameCourse);
    const conflicts = conflictingSections(candidate, withoutSame);
    if (sameCourse || conflicts.length) setPending({ candidate, conflicts, sameCourse });
    else { onChange(customizeSchedule(schedule, [...current, candidate])); setOpen(false); }
  };

  const confirmAdd = () => {
    if (!pending) return;
    const removed = new Set([pending.sameCourse, ...pending.conflicts].filter(Boolean).map((section) => `${section?.course_id}-${section?.section_id}`));
    const kept = (schedule?.sections || []).filter((section) => !removed.has(`${section.course_id}-${section.section_id}`));
    onChange(customizeSchedule(schedule, [...kept, pending.candidate]));
    setPending(null); setOpen(false);
  };

  const remove = (section: Section) => onChange(customizeSchedule(schedule, (schedule?.sections || []).filter((item) => item !== section)));

  return (
    <section aria-label="Schedule builder" className="builder-panel rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-slate-100">Schedule builder</h2><p className="text-[10px] text-slate-500">Add, replace, or remove individual sections.</p></div><button type="button" onClick={() => setOpen((value) => !value)} className="builder-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white">{open ? <X className="h-3.5 w-3.5"/> : <Plus className="h-3.5 w-3.5"/>}{open ? 'Close' : 'Add class'}</button></div>
      {schedule?.sections.length ? <div className="mt-3 flex flex-wrap gap-2">{schedule.sections.map((section) => <div key={`${section.course_id}-${section.section_id}`} className="builder-chip flex items-center gap-2 rounded-xl px-2.5 py-2 text-[11px]"><span className="font-semibold">{section.course_id}</span><span className="builder-chip-muted">{section.section_id}</span><button type="button" aria-label={`Remove ${section.course_id} ${section.section_id}`} onClick={() => remove(section)} className="builder-chip-muted hover:text-red-400"><Trash2 className="h-3 w-3"/></button></div>)}</div> : <p className="mt-3 text-xs text-slate-500">Start from an empty schedule or generate one, then customize it here.</p>}
      {open && <div className="mt-3 space-y-3 border-t border-slate-800 pt-3">
        <label className="relative block"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500"/><input value={query} onChange={(event) => { setQuery(event.target.value.toUpperCase()); setCourse(null); }} placeholder="Search CMSC132 or Linear Algebra" className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-slate-100"/></label>
        {results.length > 0 && <div className="grid gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">{results.map((result) => <button type="button" key={result.course_id} onClick={() => chooseCourse(result)} className="flex justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-800"><span className="font-semibold text-slate-200">{result.course_id}</span><span className="truncate pl-3 text-slate-500">{result.name}</span></button>)}</div>}
        {loading && <p className="text-xs text-slate-500">Loading sections…</p>}{error && <p className="text-xs text-red-400">{error}</p>}
        {course && <div className="max-h-80 space-y-2 overflow-y-auto pr-1"><div className="flex justify-between text-xs"><strong className="text-slate-200">{course.course_id} · {course.name}</strong><span className="text-slate-500">{course.credits} cr</span></div>{course.sections.map((raw) => { const section = asSection(course, raw); return <article key={raw.section_id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"><div className="flex items-start justify-between gap-2"><div><strong className="text-xs text-slate-200">Section {raw.section_id}</strong><p className="text-[10px] text-slate-500">{raw.instructor || 'Instructor TBA'} · {raw.avg_rating ? `${raw.avg_rating.toFixed(1)} ★` : 'No rating'} · {raw.avg_gpa != null ? `${raw.avg_gpa.toFixed(2)} GPA` : 'No GPA data'}</p></div><button type="button" onClick={() => requestAdd(section)} className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-900"><Plus className="mr-1 inline h-3 w-3"/>Add</button></div><div className="mt-2 space-y-1 text-[10px] text-slate-400">{raw.meetings.length ? raw.meetings.map((meeting, index) => <div key={`${meeting.day}-${meeting.start_time}-${index}`}>{dayLabel(meeting.day)} {meeting.start_time}–{meeting.end_time} · {meeting.class_type || 'Class'} · {meeting.building || 'TBA'} {meeting.room || ''}</div>) : <div>Meeting time TBA</div>}</div><div className={`mt-2 text-[10px] font-semibold ${raw.open_seats > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{raw.open_seats > 0 ? `${raw.open_seats} seats open` : `Waitlist or closed · waitlist ${raw.waitlist_count}`}</div></article>; })}</div>}
      </div>}
      {pending && <div role="alert" className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3"><div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"/><div><strong className="text-xs text-amber-200">This changes your current schedule</strong>{pending.sameCourse && <p className="mt-1 text-[11px] text-amber-100/70">Replaces {pending.sameCourse.course_id} section {pending.sameCourse.section_id}.</p>}{pending.conflicts.length > 0 && <p className="mt-1 text-[11px] text-amber-100/70">Conflicts with {pending.conflicts.map((section) => `${section.course_id} ${section.section_id}`).join(', ')}. Continuing removes {pending.conflicts.length === 1 ? 'it' : 'them'}.</p>}<div className="mt-3 flex gap-2"><button type="button" onClick={() => setPending(null)} className="rounded-lg border border-amber-500/30 px-2.5 py-1.5 text-[10px] text-amber-100">Keep current</button><button type="button" onClick={confirmAdd} className="rounded-lg bg-amber-400 px-2.5 py-1.5 text-[10px] font-semibold text-slate-950"><Check className="mr-1 inline h-3 w-3"/>Replace and add</button></div></div></div></div>}
    </section>
  );
};
