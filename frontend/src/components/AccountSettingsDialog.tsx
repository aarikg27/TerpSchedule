import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Database, LoaderCircle, Trash2, X } from 'lucide-react';
import { authClient } from '../auth';
import { deleteOwnAccount, deleteWorkspaceData } from '../api/workspace';
import { BrandMark } from './BrandMark';
import { useModalDialog } from '../hooks/useModalDialog';

interface Props {
  user: { id: string; name?: string | null; email: string };
  onClose: () => void;
}

function clearAccountCaches(userId: string) {
  localStorage.removeItem(`terpschedule-saved-schedules-v2:${userId}`);
  localStorage.removeItem(`terpschedule-audit-summary-v1:${userId}`);
  localStorage.removeItem('terpschedule-saved-schedules-v1');
  localStorage.removeItem(`terpschedule-saved-v2:${userId}`);
  localStorage.removeItem('terpschedule-saved-v1');
}

export const AccountSettingsDialog: React.FC<Props> = ({ user, onClose }) => {
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState<'data' | 'account' | null>(null);
  const [message, setMessage] = useState('');
  const dialogRef = useRef<HTMLElement>(null);
  useModalDialog(dialogRef, onClose);

  const clearData = async () => {
    setBusy('data'); setMessage('');
    try {
      await deleteWorkspaceData(user.id);
      clearAccountCaches(user.id);
      window.location.reload();
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : 'Could not finish deleting your synced planning data.';
      setMessage(detail);
    } finally { setBusy(null); }
  };

  const deleteAccount = async () => {
    if (!authClient || confirmText !== 'DELETE') return;
    setBusy('account'); setMessage('');
    try {
      await deleteOwnAccount();
      clearAccountCaches(user.id);
      await authClient.signOut().catch(() => undefined);
      window.location.assign('/');
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : 'Could not delete the account.';
      setMessage(detail);
      setBusy(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:py-8" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <article ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Account and data settings" className="account-dialog relative my-auto w-full max-w-lg rounded-[28px] border border-black/10 bg-white p-6 shadow-2xl outline-none sm:p-8">
        <button type="button" onClick={onClose} aria-label="Close account settings" className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-600"><X className="h-4 w-4"/></button>
        <div className="flex items-center gap-3 pr-10"><BrandMark className="h-11 w-11 shrink-0"/><div><div className="text-xs font-semibold uppercase tracking-[.16em] text-red-600">TerpSchedule</div><h2 className="text-2xl font-semibold tracking-tight text-slate-900">Account & data</h2></div></div>
        <div className="mt-6 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-900">{user.name || 'Signed-in user'}</p><p className="mt-1 text-xs text-slate-500">{user.email}</p></div>

        <section className="mt-5 rounded-2xl border border-slate-200 p-4">
          <div className="flex gap-3"><Database className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"/><div><h3 className="text-sm font-semibold text-slate-900">Clear planning data</h3><p className="mt-1 text-xs leading-5 text-slate-500">Permanently removes synced schedules, planner preferences, and the structured degree-audit analysis. Your login remains active.</p></div></div>
          <button type="button" disabled={busy !== null} onClick={clearData} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{busy === 'data' && <LoaderCircle className="h-4 w-4 animate-spin"/>}Clear my planning data</button>
        </section>

        <section className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600"/><div><h3 className="text-sm font-semibold text-red-900">Delete account permanently</h3><p className="mt-1 text-xs leading-5 text-red-700">Deletes all TerpSchedule planning data first, then removes your authentication account and sessions. This cannot be undone.</p></div></div>
          <label className="mt-4 block text-xs font-medium text-red-900">Type DELETE to confirm<input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} autoComplete="off" className="mt-1.5 w-full rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-red-500"/></label>
          <button type="button" disabled={busy !== null || confirmText !== 'DELETE'} onClick={deleteAccount} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40">{busy === 'account' ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}Delete my account</button>
        </section>
        {message && <p role="status" className="mt-4 rounded-xl bg-slate-100 px-3 py-2.5 text-xs leading-5 text-slate-700">{message}</p>}
      </article>
    </div>, document.body
  );
};
