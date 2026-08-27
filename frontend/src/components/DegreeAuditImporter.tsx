import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileUp, GraduationCap, LoaderCircle, Trash2, X } from 'lucide-react';
import { parseDegreeAudit, type AuditSummary } from '../api/client';
import { authClient, neonClient } from '../auth';
import { deleteAuditSummary, loadAuditSummary, saveAuditSummary } from '../api/workspace';
import { useModalDialog } from '../hooks/useModalDialog';

interface Props { onAddCourses: (courses: string[]) => void }
type LocalAuditCache = { summary: AuditSummary; savedAt: string };

export const DegreeAuditImporter: React.FC<Props> = ({ onAddCourses }) => {
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [cloudSynced, setCloudSynced] = useState(false);
  const session = authClient?.useSession();
  const user = session?.data?.user;
  const userId = user?.id;
  useModalDialog(dialog, () => setOpen(false), open);
  const localKey = `terpschedule-audit-summary-v1:${userId || 'guest'}`;
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      let local: LocalAuditCache | null = null;
      try { local = JSON.parse(localStorage.getItem(localKey) || 'null') as LocalAuditCache | null; } catch { /* ignore damaged local cache */ }
      if (cancelled) return;
      setSummary(local?.summary.parser_version === 3 ? local.summary : null);
      setSavedAt(local?.summary.parser_version === 3 ? local.savedAt : null);
      setCloudSynced(false);
      if (!userId || !neonClient) return;
      try {
        const stored = await loadAuditSummary();
        if (!cancelled && stored?.summary.parser_version === 3) {
          const storedAt = stored.source_date || stored.updated_at;
          setSummary(stored.summary); setSavedAt(storedAt); setCloudSynced(true);
          localStorage.setItem(localKey, JSON.stringify({ summary: stored.summary, savedAt: storedAt }));
        }
      } catch { /* retain the local copy */ }
    });
    return () => { cancelled = true; };
  }, [userId, localKey]);
  const upload = async (file?: File) => {
    if (!file) return; setLoading(true); setError('');
    try {
      const parsed = await parseDegreeAudit(file);
      const importedAt = new Date().toISOString();
      setSummary(parsed); setSavedAt(importedAt);
      localStorage.setItem(localKey, JSON.stringify({ summary: parsed, savedAt: importedAt }));
      if (user && neonClient) { await saveAuditSummary(user.id, parsed, importedAt); setCloudSynced(true); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not read that audit.'); }
    finally { setLoading(false); }
  };
  const suggested = summary ? (summary.suggested_courses || []).filter((course) => !summary.in_progress_courses.includes(course) && !summary.completed_courses?.includes(course)).slice(0, 20) : [];
  const remainingRequirements = summary?.requirements.filter((item) => item.status === 'remaining' && !item.is_group) || [];
  const completedRequirements = summary?.requirements.filter((item) => item.status === 'complete' && !item.is_group) || [];
  const genEds = summary?.gen_ed_requirements || remainingRequirements.filter((item) => item.category?.toLowerCase().includes('gened'));
  const progress = summary?.completed_credits && summary.total_credits_required ? Math.min(100, (summary.completed_credits / summary.total_credits_required) * 100) : 0;

  return <>
    <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:border-slate-500"><GraduationCap className="h-4 w-4"/> {summary ? 'View degree progress' : 'Import degree audit'}</button>
    {open && createPortal(<div className="fixed inset-0 z-[1000] grid place-items-center bg-black/60 p-4 backdrop-blur-md" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Import degree audit" className="audit-dialog max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl outline-none dark:border-white/10">
        <div className="flex items-start justify-between"><div><h2 className="text-xl font-bold text-slate-900">Import your UMD degree audit</h2><p className="mt-1 text-xs text-slate-500">No AI required. The PDF is parsed for this request and is not retained.</p></div><button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4"/></button></div>
        <ol className="my-4 grid gap-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 sm:grid-cols-3">
          <li><strong className="block text-slate-900">1. Testudo</strong>Open Degree Audit and run a new audit.</li>
          <li><strong className="block text-slate-900">2. Open it</strong>Select the completed audit, then choose Printer Friendly.</li>
          <li><strong className="block text-slate-900">3. Download</strong>Save that printer-friendly page as a PDF and upload it here.</li>
        </ol>
        <input ref={input} type="file" accept="application/pdf" className="hidden" onChange={(event) => upload(event.target.files?.[0])}/>
        <button type="button" onClick={() => input.current?.click()} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <FileUp className="h-4 w-4"/>}{loading ? 'Reading audit…' : summary ? 'Upload a newer audit' : 'Choose printer-friendly PDF'}</button>
        {error && <p className="mt-3 rounded-xl bg-red-950/50 p-3 text-xs text-red-300">{error}</p>}
        {summary && <div className="mt-4 space-y-4"><div className="flex items-center justify-between gap-3 text-[10px] text-slate-500"><span>Analysis saved {savedAt ? new Date(savedAt).toLocaleString() : ''}{cloudSynced ? ' · synced to account' : ' · on this device'}</span><button type="button" onClick={async () => { setSummary(null); setSavedAt(null); setCloudSynced(false); localStorage.removeItem(localKey); if (user && neonClient) await deleteAuditSummary(user.id).catch(() => undefined); }} className="flex items-center gap-1 text-red-500"><Trash2 className="h-3 w-3"/> Clear</button></div>
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-end justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Degree credit progress</p><p className="mt-1 text-2xl font-semibold text-slate-900">{summary.completed_credits ?? '—'} <span className="text-sm font-normal text-slate-500">of {summary.total_credits_required ?? 120} completed</span></p></div><strong className="text-2xl text-red-600">{summary.credits_remaining_after_in_progress ?? summary.credits_remaining ?? '—'} <span className="block text-right text-[10px] font-medium text-slate-500">left after current courses</span></strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-red-600" style={{ width: `${progress}%` }}/></div><p className="mt-2 text-[10px] text-slate-500">{summary.credits_remaining ?? '—'} credits remain today · {summary.in_progress_credits ?? '—'} credits are currently in progress.</p></section>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[[summary.completed_credits ?? '—','credits complete'],[summary.credits_remaining_after_in_progress ?? '—','credits left'],[remainingRequirements.length || summary.remaining_requirement_count,'requirements to review'],[summary.in_progress_courses.length,'courses in progress']].map(([value,label]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3 text-center"><strong className="block text-lg text-slate-900">{value}</strong><span className="text-[10px] text-slate-500">{label}</span></div>)}</div>
          {!!summary.in_progress_courses.length && <section className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="text-sm font-semibold text-slate-900">In progress now</h3><div className="mt-2 flex flex-wrap gap-2">{summary.in_progress_courses.map((course) => <button type="button" key={course} onClick={() => onAddCourses([course])} className="rounded-full bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700">{course} · add to planner</button>)}</div></section>}
          {!!genEds.length && <section className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="text-sm font-semibold text-slate-900">GenEds still needed</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{genEds.map((item, index) => <div key={`${item.name}-${index}`} className="rounded-xl bg-slate-50 p-3"><div className="flex items-start justify-between gap-2"><span className="text-xs font-medium text-slate-800">{item.name}</span>{item.code && <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-700">{item.code}</span>}</div><p className="mt-1 text-[10px] text-slate-500">{item.courses_needed ? `${item.courses_needed} course${item.courses_needed === 1 ? '' : 's'}` : ''}{item.courses_needed && item.credits_needed ? ' · ' : ''}{item.credits_needed ? `${item.credits_needed} credits` : ''}</p></div>)}</div></section>}
          <details className="rounded-2xl border border-slate-200 bg-white p-4" open><summary className="cursor-pointer text-sm font-semibold text-slate-900">All remaining requirements ({remainingRequirements.length})</summary><div className="mt-3 space-y-2">{remainingRequirements.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 border-t border-slate-100 pt-2 first:border-0 first:pt-0"><div><p className="text-xs font-medium text-slate-800">{item.name}</p><p className="text-[10px] text-slate-500">{item.group || item.category || 'Degree requirement'}</p></div><span className="shrink-0 text-[10px] font-semibold text-red-600">{item.courses_needed ? `${item.courses_needed} course${item.courses_needed === 1 ? '' : 's'}` : item.credits_needed ? `${item.credits_needed} credits` : 'Review audit'}</span></div>)}</div></details>
          <details className="rounded-2xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-900">Completed requirements ({completedRequirements.length})</summary><div className="mt-3 flex flex-wrap gap-1.5">{completedRequirements.map((item, index) => <span key={`${item.name}-${index}`} className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">✓ {item.name}</span>)}</div></details>
          {!!summary.course_records?.length && <details className="rounded-2xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-900">Recognized course rows ({summary.course_records.length})</summary><div className="mt-3 grid gap-1.5 sm:grid-cols-2">{summary.course_records.map((course, index) => <div key={`${course.term}-${course.course_id}-${index}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[10px]"><span><strong className="text-slate-800">{course.course_id}</strong> <span className="text-slate-500">· {course.term}</span></span><span className={course.status === 'in_progress' ? 'font-semibold text-amber-700' : 'text-slate-500'}>{course.credits} cr · {course.status === 'in_progress' ? 'In progress' : course.grade}</span></div>)}</div></details>}
          {!!suggested.length && <div className="rounded-2xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold text-slate-900">Eligible course options found</p><p className="mt-1 text-[10px] text-slate-500">These are alternatives from the audit, not mandates. Add only courses you choose after reviewing the requirement.</p><div className="mt-2 flex flex-wrap gap-1.5">{suggested.map((course) => <button type="button" onClick={() => onAddCourses([course])} key={course} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-700 hover:bg-slate-200">+ {course}</button>)}</div></div>}
          <p className="text-[10px] text-slate-500">{summary.disclaimer}</p></div>}
      </div>
    </div>, document.body)}
  </>;
};
