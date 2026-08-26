import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Check, Copy, RefreshCw, Trash2 } from 'lucide-react';
import type { RankedSchedule } from '../types/schedule';
import { getSectionStatuses } from '../api/client';
import { authClient, neonClient } from '../auth';
import { deleteCloudSchedule, loadCloudSchedules, saveCloudSchedule } from '../api/workspace';

type SavedSchedule = { id: string; name: string; term: string; savedAt: string; schedule: RankedSchedule };

const storageKey = 'terpschedule-saved-schedules-v1';

function readSaved(): SavedSchedule[] {
  try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
}

interface Props { schedule: RankedSchedule | null; term: string; onSelect: (schedule: RankedSchedule) => void }

export const ScheduleActions: React.FC<Props> = ({ schedule, term, onSelect }) => {
  const [saved, setSaved] = useState<SavedSchedule[]>(readSaved);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState('');
  const session = authClient?.useSession();
  const user = session?.data?.user;
  const signature = useMemo(() => schedule?.sections.map((item) => `${item.course_id}-${item.section_id}`).join('|'), [schedule]);

  const persist = (items: SavedSchedule[]) => { setSaved(items); localStorage.setItem(storageKey, JSON.stringify(items)); };
  useEffect(() => {
    if (!user || !neonClient) return;
    loadCloudSchedules().then((records) => {
      const items = records.map((record) => ({ id: record.id, name: record.name, term: record.term, savedAt: record.created_at, schedule: record.schedule }));
      persist(items);
    }).catch(() => setNotice('Cloud saves are temporarily unavailable; device saves still work.'));
  }, [user?.id]);

  const save = async () => {
    if (!schedule || !signature) return;
    if (saved.some((item) => item.term === term && item.schedule.sections.map((section) => `${section.course_id}-${section.section_id}`).join('|') === signature)) return;
    const item = { id: crypto.randomUUID(), name: `Schedule ${saved.length + 1}`, term, savedAt: new Date().toISOString(), schedule };
    persist([item, ...saved].slice(0, 20));
    if (user && neonClient) {
      try { await saveCloudSchedule({ id: item.id, user_id: user.id, name: item.name, term, schedule }); setNotice('Saved to your account and this device.'); }
      catch { setNotice('Saved on this device, but cloud sync failed.'); }
    }
  };
  const share = async () => {
    if (!schedule) return;
    const payload = btoa(encodeURIComponent(JSON.stringify({ term, schedule })));
    await navigator.clipboard.writeText(`${window.location.origin}/planner#share=${payload}`);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  const checkSeats = async () => {
    if (!schedule) return; setChecking(true); setNotice('');
    try {
      const statuses = await getSectionStatuses(schedule.sections.map((item) => `${item.course_id}-${item.section_id}`), term);
      const newlyOpen = statuses.filter((status) => status.open_seats > 0 && (schedule.sections.find((item) => item.course_id === status.course_id && item.section_id === status.section_id)?.open_seats || 0) <= 0);
      setNotice(newlyOpen.length ? `${newlyOpen.map((item) => `${item.course_id}-${item.section_id}`).join(', ')} ${newlyOpen.length === 1 ? 'is' : 'are'} open now.` : 'No newly opened sections since this schedule was generated.');
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : 'Could not refresh seats.'); }
    finally { setChecking(false); }
  };

  return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-md">
    <div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">My schedules</span><span className="text-[9px] text-slate-500">{user && neonClient ? 'Synced to account' : 'Saved on this device'}</span></div>
    <div className="grid grid-cols-2 gap-2">
      <button type="button" disabled={!schedule} onClick={save} className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-2 text-[10px] font-semibold text-slate-800 disabled:opacity-40"><Bookmark className="h-3 w-3"/> Save</button>
      <button type="button" disabled={!schedule} onClick={share} className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 px-2 py-2 text-[10px] font-semibold text-slate-200 disabled:opacity-40">{copied ? <Check className="h-3 w-3"/> : <Copy className="h-3 w-3"/>}{copied ? 'Link copied' : 'Share link'}</button>
    </div>
    <button type="button" disabled={!schedule || checking} onClick={checkSeats} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700 px-2 py-2 text-[10px] font-semibold text-slate-300 disabled:opacity-40"><RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`}/> {checking ? 'Checking live cache…' : 'Check for newly open seats'}</button>
    {notice && <p className="mt-2 rounded-xl bg-slate-950/60 p-2 text-[10px] text-slate-300">{notice}</p>}
    {!!saved.length && <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">{saved.map((item) => <div key={item.id} className="flex items-center gap-1 rounded-xl bg-slate-950/70 p-1.5"><button type="button" onClick={() => onSelect(item.schedule)} className="min-w-0 flex-1 text-left"><span className="block truncate text-[10px] font-semibold text-slate-200">{item.name}</span><span className="block truncate text-[9px] text-slate-500">{item.schedule.sections.map((section) => section.course_id).join(' · ')}</span></button><button type="button" aria-label={`Delete ${item.name}`} onClick={async () => { persist(saved.filter((savedItem) => savedItem.id !== item.id)); if (user && neonClient) await deleteCloudSchedule(item.id).catch(() => setNotice('Removed locally; cloud deletion will need another try.')); }} className="rounded-lg p-1.5 text-slate-600 hover:text-red-400"><Trash2 className="h-3 w-3"/></button></div>)}</div>}
  </div>;
};
