import React, { useState } from 'react';
import { ArrowRight, CalendarDays, Check, Moon, Route, ShieldCheck, Sparkles, Sun } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import { authClient } from '../auth';

export const LandingPage: React.FC<{ onStart: () => void; theme: 'light' | 'dark' | 'system'; onToggleTheme: () => void }> = ({ onStart, theme, onToggleTheme }) => {
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up' | null>(null);
  const session = authClient?.useSession();
  return <div className="landing-page min-h-screen overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <button type="button" onClick={onStart} className="flex items-center gap-2.5" aria-label="Open TerpSchedule planner">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-sm font-black text-white">M</span>
        <span className="text-lg font-semibold tracking-tight">TerpSchedule</span>
      </button>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onToggleTheme} aria-label={`Switch from ${theme} theme`} className="rounded-full p-2.5 text-slate-500 hover:bg-black/5">{theme === 'dark' ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}</button>
        {session?.data?.user ? <button type="button" onClick={onStart} className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">Open planner</button> : authClient && <><button type="button" onClick={() => setAuthMode('sign-in')} className="hidden rounded-full px-4 py-2 text-xs font-semibold sm:block">Sign in</button><button type="button" onClick={() => setAuthMode('sign-up')} className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">Create account</button></>}
      </div>
    </header>

    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:pb-28 lg:pt-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm"><Sparkles className="h-3.5 w-3.5 text-red-500"/> Built for UMD students</div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-7xl">Your semester,<br/><span className="text-slate-400">without the spreadsheet.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Compare every conflict-free schedule, rank what matters to you, and know which options you can register for right now.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3"><button type="button" onClick={onStart} className="group flex items-center gap-2 rounded-full bg-red-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-500">Start planning <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5"/></button><span className="text-xs text-slate-500">No account required</span></div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">{['Live Testudo sections','Open-seat filtering','Walking estimates'].map(item => <span key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-500"/>{item}</span>)}</div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-16 rounded-full bg-gradient-to-br from-red-200/50 via-amber-100/30 to-blue-100/50 blur-3xl"/>
          <div className="relative rounded-[32px] border border-white/80 bg-white/80 p-4 shadow-[0_40px_100px_rgba(0,0,0,.12)] backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-center justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">Top schedule</div><div className="mt-1 text-xl font-semibold">A balanced Tuesday</div></div><div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Open now</div></div>
            <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">{['Mon','Tue','Wed','Thu','Fri'].map(day => <div key={day}>{day}</div>)}</div>
            <div className="mt-2 grid h-72 grid-cols-5 gap-2 rounded-2xl bg-slate-50 p-2">
              <div className="relative"/><div className="relative"><div className="absolute inset-x-0 top-[12%] rounded-xl border border-red-200 bg-red-50 p-2 text-left"><b className="text-xs text-red-700">CMSC132</b><div className="mt-1 text-[9px] text-red-500">9:30 · IRB</div></div><div className="absolute inset-x-0 top-[54%] rounded-xl border border-indigo-200 bg-indigo-50 p-2 text-left"><b className="text-xs text-indigo-700">MATH240</b><div className="mt-1 text-[9px] text-indigo-500">1:00 · MTH</div></div></div><div/><div className="relative"><div className="absolute inset-x-0 top-[30%] rounded-xl border border-cyan-200 bg-cyan-50 p-2 text-left"><b className="text-xs text-cyan-700">STAT400</b><div className="mt-1 text-[9px] text-cyan-500">11:00 · ESJ</div></div></div><div/>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">{[[CalendarDays,'4 days','On campus'],[Route,'8 min','Longest walk'],[ShieldCheck,'3 open','Sections']].map(([Icon,value,label]) => { const C=Icon as typeof CalendarDays; return <div key={String(label)} className="rounded-2xl bg-slate-50 p-3"><C className="h-4 w-4 text-slate-400"/><div className="mt-2 text-sm font-semibold">{String(value)}</div><div className="text-[10px] text-slate-400">{String(label)}</div></div>})}</div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white/55"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-3">{[[CalendarDays,'See every possibility','TerpSchedule checks section combinations and removes conflicts automatically.'],[Sparkles,'Rank your way','Put instructors, compact days, campus time, and walking ease in your preferred order.'],[Route,'Know before you go','See rooms, estimated transitions, and accurate Google Maps walking links.']].map(([Icon,title,copy]) => { const C=Icon as typeof CalendarDays; return <article key={String(title)}><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100"><C className="h-5 w-5 text-slate-600"/></div><h2 className="mt-5 text-lg font-semibold">{String(title)}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{String(copy)}</p></article>})}</div></section>
    </main>
    <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-[11px] text-slate-500 sm:px-8"><span>Unofficial UMD planning tool. Always verify in Testudo.</span><button type="button" onClick={onStart} className="font-semibold text-slate-700">Open planner →</button></footer>
    {authMode && <AuthDialog mode={authMode} onClose={() => setAuthMode(null)} />}
  </div>;
};
