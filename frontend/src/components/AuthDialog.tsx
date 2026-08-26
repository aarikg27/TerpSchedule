import React, { useState } from 'react';
import { X } from 'lucide-react';
import { authClient } from '../auth';

export const AuthDialog: React.FC<{ mode: 'sign-in' | 'sign-up'; onClose: () => void }> = ({ mode, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!authClient) return;
    setBusy(true); setError(null);
    try {
      const result = mode === 'sign-in'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name: name.trim() || email.split('@')[0] });
      if (result.error) throw new Error(result.error.message || 'Authentication failed');
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Authentication failed');
    } finally { setBusy(false); }
  };

  const google = async () => {
    if (!authClient) return;
    setBusy(true); setError(null);
    try {
      const result = await authClient.signIn.social({ provider: 'google', callbackURL: window.location.href });
      if (result?.error) throw new Error(result.error.message || 'Google sign-in failed');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Google sign-in failed');
      setBusy(false);
    }
  };

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-label={mode === 'sign-in' ? 'Sign in to TerpSchedule' : 'Create a TerpSchedule account'} className="auth-dialog relative w-full max-w-md rounded-[28px] border border-black/10 bg-white p-6 shadow-2xl sm:p-8">
      <button type="button" onClick={onClose} aria-label="Close account dialog" className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-600"><X className="h-4 w-4" /></button>
      <div className="pr-10"><div className="text-xs font-semibold uppercase tracking-[.16em] text-red-600">TerpSchedule</div><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{mode === 'sign-in' ? 'Welcome back' : 'Save your best schedules'}</h2><p className="mt-1 text-xs text-slate-500">Accounts are optional. Planning always works as a guest.</p></div>
      <button type="button" disabled={busy} onClick={google} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"><span className="text-base font-bold text-blue-600">G</span> Continue with Google</button>
      <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-wide text-slate-400"><span className="h-px flex-1 bg-black/10"/>or use email<span className="h-px flex-1 bg-black/10"/></div>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'sign-up' && <label className="block text-xs font-medium text-slate-600">Name<input required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="mt-1.5 w-full rounded-xl border border-black/10 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500" /></label>}
        <label className="block text-xs font-medium text-slate-600">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-1.5 w-full rounded-xl border border-black/10 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500" /></label>
        <label className="block text-xs font-medium text-slate-600">Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} className="mt-1.5 w-full rounded-xl border border-black/10 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500" /></label>
        {error && <div role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
        <button disabled={busy} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button>
      </form>
    </div>
  </div>;
};
