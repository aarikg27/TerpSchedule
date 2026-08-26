import React, { useRef, useState } from 'react';
import { FileUp, GraduationCap, LoaderCircle, X } from 'lucide-react';
import { parseDegreeAudit, type AuditSummary } from '../api/client';

interface Props { onAddCourses: (courses: string[]) => void }

export const DegreeAuditImporter: React.FC<Props> = ({ onAddCourses }) => {
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const upload = async (file?: File) => {
    if (!file) return; setLoading(true); setError('');
    try { setSummary(await parseDegreeAudit(file)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not read that audit.'); }
    finally { setLoading(false); }
  };
  const suggested = summary ? [...new Set(summary.requirements.filter((item) => item.status === 'remaining').flatMap((item) => item.courses_mentioned))].filter((course) => !summary.in_progress_courses.includes(course)).slice(0, 12) : [];

  return <>
    <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:border-slate-500"><GraduationCap className="h-4 w-4"/> Import degree audit</button>
    {open && <div className="fixed inset-0 z-[80] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Import degree audit">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-start justify-between"><div><h2 className="text-xl font-bold text-slate-100">Import your UMD degree audit</h2><p className="mt-1 text-xs text-slate-400">No AI required. The PDF is parsed for this request and is not retained.</p></div><button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-800"><X className="h-4 w-4"/></button></div>
        <ol className="my-4 grid gap-2 rounded-2xl bg-slate-950/60 p-4 text-xs text-slate-300 sm:grid-cols-3">
          <li><strong className="block text-white">1. Testudo</strong>Open Degree Audit and run a new audit.</li>
          <li><strong className="block text-white">2. Open it</strong>Select the completed audit, then choose Printer Friendly.</li>
          <li><strong className="block text-white">3. Download</strong>Save that printer-friendly page as a PDF and upload it here.</li>
        </ol>
        <input ref={input} type="file" accept="application/pdf" className="hidden" onChange={(event) => upload(event.target.files?.[0])}/>
        <button type="button" onClick={() => input.current?.click()} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <FileUp className="h-4 w-4"/>}{loading ? 'Reading audit…' : 'Choose printer-friendly PDF'}</button>
        {error && <p className="mt-3 rounded-xl bg-red-950/50 p-3 text-xs text-red-300">{error}</p>}
        {summary && <div className="mt-4 space-y-3"><div className="grid grid-cols-3 gap-2">{[[summary.completed_credits ?? '—','credits complete'],[summary.remaining_requirement_count,'requirements remaining'],[summary.in_progress_courses.length,'courses in progress']].map(([value,label]) => <div key={label} className="rounded-2xl bg-slate-800 p-3 text-center"><strong className="block text-lg text-white">{value}</strong><span className="text-[10px] text-slate-400">{label}</span></div>)}</div>
          {!!suggested.length && <div className="rounded-2xl border border-slate-700 p-3"><p className="text-xs font-semibold text-slate-200">Courses mentioned in remaining requirements</p><p className="mt-1 text-[10px] text-slate-500">These may be alternatives, not mandates. Add only courses you have chosen after reviewing the requirement.</p><div className="mt-2 flex flex-wrap gap-1.5">{suggested.map((course) => <button type="button" onClick={() => onAddCourses([course])} key={course} className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700">+ {course}</button>)}</div></div>}
          <p className="text-[10px] text-slate-500">{summary.disclaimer}</p></div>}
      </div>
    </div>}
  </>;
};
