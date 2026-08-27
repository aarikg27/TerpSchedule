import React, { useState } from 'react';
import { ArrowRight, CalendarDays, Check, Layers3, Moon, Route, ShieldCheck, Sparkles, Sun, Zap } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import { authClient } from '../auth';
import { BrandMark } from './BrandMark';
import type { LegalPage } from './LegalDialog';

interface LandingPageProps {
  onStart: () => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
  onLegalPage: (page: LegalPage) => void;
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, theme, onToggleTheme, onLegalPage }) => {
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up' | null>(null);
  const session = authClient?.useSession();

  return <div className="landing-page min-h-screen overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
    <header className="landing-nav sticky top-0 z-40 border-b border-transparent">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <button type="button" onClick={onStart} className="group flex items-center gap-2.5" aria-label="Open TerpSchedule planner">
          <BrandMark className="h-9 w-9 shrink-0 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105" />
          <span className="text-lg font-semibold tracking-tight">TerpSchedule</span>
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggleTheme} aria-label={`Switch from ${theme} theme`} className="rounded-full p-2.5 text-slate-500 hover:bg-black/5">{theme === 'dark' ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}</button>
          {session?.data?.user ? <button type="button" onClick={onStart} className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5">Open planner</button> : authClient && <><button type="button" onClick={() => setAuthMode('sign-in')} className="hidden rounded-full px-4 py-2 text-xs font-semibold hover:bg-black/5 sm:block">Sign in</button><button type="button" onClick={() => setAuthMode('sign-up')} className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5">Create account</button></>}
        </div>
      </div>
    </header>

    <main>
      <section className="landing-hero relative border-0">
        <div className="landing-grid absolute inset-0 opacity-60" aria-hidden="true"/>
        <div className="landing-orb landing-orb-red absolute -left-32 top-0 h-96 w-96 rounded-full" aria-hidden="true"/>
        <div className="landing-orb landing-orb-blue absolute -right-40 top-28 h-[28rem] w-[28rem] rounded-full" aria-hidden="true"/>
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:pb-32 lg:pt-24">
          <div className="landing-rise">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur"><Sparkles className="h-3.5 w-3.5 text-red-500"/> Built by a student, for UMD students</div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[.96] tracking-[-.058em] sm:text-7xl">Your semester,<br/><span className="landing-gradient-text">finally figured out.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Turn your course list into ranked, conflict-free schedules—with live seat context, professor data, and the walking details that actually shape your week.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3"><button type="button" onClick={onStart} className="landing-primary-button group flex items-center gap-2 rounded-full bg-red-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20">Build my schedule <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></button><span className="text-xs text-slate-600">Free · no account required</span></div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">{['Live section data','Open-seat filtering','Degree-audit planning'].map(item => <span key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600"/>{item}</span>)}</div>
          </div>

          <div className="landing-preview relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-16 rounded-full bg-gradient-to-br from-red-200/50 via-amber-100/30 to-blue-100/50 blur-3xl" aria-hidden="true"/>
            <div className="landing-float-chip landing-chip-left absolute -left-7 top-24 z-20 hidden rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-xl backdrop-blur sm:block"><div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Preference</div><div className="mt-0.5 text-xs font-semibold">No Friday classes</div></div>
            <div className="landing-float-chip landing-chip-right absolute -right-5 bottom-24 z-20 hidden rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-xl backdrop-blur sm:block"><div className="flex items-center gap-1.5 text-xs font-semibold"><Route className="h-3.5 w-3.5 text-blue-600"/> 8 min walk</div><div className="mt-0.5 text-[9px] text-slate-500">IRB → ESJ</div></div>
            <div className="relative rounded-[32px] border border-white/80 bg-white/80 p-4 shadow-[0_40px_100px_rgba(0,0,0,.12)] backdrop-blur-xl sm:p-6">
              <div className="mb-5 flex items-center justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">Your #1 schedule</div><div className="mt-1 text-xl font-semibold">Balanced and open</div></div><div className="landing-live-pill rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"/>Open now</div></div>
              <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">{days.map(day => <div key={day}>{day}</div>)}</div>
              <div className="mt-2 grid h-72 grid-cols-5 gap-2 rounded-2xl bg-slate-50 p-2">
                <div className="relative"/><div className="relative"><div className="landing-class-card absolute inset-x-0 top-[12%] rounded-xl border border-red-200 bg-red-50 p-2 text-left"><b className="text-xs text-red-700">CMSC132</b><div className="mt-1 text-[9px] text-red-700">9:30 · IRB</div></div><div className="landing-class-card landing-delay-1 absolute inset-x-0 top-[54%] rounded-xl border border-indigo-200 bg-indigo-50 p-2 text-left"><b className="text-xs text-indigo-700">MATH240</b><div className="mt-1 text-[9px] text-indigo-700">1:00 · MTH</div></div></div><div/><div className="relative"><div className="landing-class-card landing-delay-2 absolute inset-x-0 top-[30%] rounded-xl border border-cyan-200 bg-cyan-50 p-2 text-left"><b className="text-xs text-cyan-700">STAT400</b><div className="mt-1 text-[9px] text-cyan-700">11:00 · ESJ</div></div></div><div/>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">{[[CalendarDays,'4 days','On campus'],[Route,'8 min','Longest walk'],[ShieldCheck,'3 open','Sections']].map(([Icon,value,label]) => { const C=Icon as typeof CalendarDays; return <div key={String(label)} className="rounded-2xl bg-slate-50 p-3 transition-transform duration-300 hover:-translate-y-1"><C className="h-4 w-4 text-slate-600"/><div className="mt-2 text-sm font-semibold">{String(value)}</div><div className="text-[10px] text-slate-600">{String(label)}</div></div>})}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white/55">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="max-w-2xl"><div className="text-xs font-semibold uppercase tracking-[.18em] text-red-600">Everything in one place</div><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-5xl">Less tab switching.<br/><span className="text-slate-500">More confident choices.</span></h2></div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">{[[Layers3,'See every possibility','TerpSchedule checks section combinations and removes conflicts automatically.'],[Sparkles,'Rank your way','Drag instructor quality, compactness, campus days, and walking ease into your preferred order.'],[Route,'Know before you go','See class types, rooms, estimated transitions, and one-click Google Maps directions.']].map(([Icon,title,copy], index) => { const C=Icon as typeof CalendarDays; return <article key={String(title)} className="landing-feature-card group rounded-[28px] border border-black/5 bg-white/70 p-6 shadow-sm"><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105"><C className="h-5 w-5 text-slate-600"/></div><span className="text-xs font-semibold text-slate-400">0{index + 1}</span></div><h3 className="mt-8 text-lg font-semibold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{String(copy)}</p></article>})}</div>
        </div>
      </section>

      <section className="border-0">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr]">
          <div><div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50"><Zap className="h-5 w-5 text-red-600"/></div><h2 className="mt-5 text-3xl font-semibold tracking-[-.04em]">From course codes to a real plan.</h2><p className="mt-3 max-w-md text-sm leading-6 text-slate-500">Pick classes, rank what matters, then move between register-now and waitlist possibilities without starting over.</p></div>
          <div className="grid gap-3 sm:grid-cols-3">{[['01','Add courses','Search by code or name.'],['02','Set your priorities','Choose your times, days, and instructors.'],['03','Compare the best','Open details, save, share, or export.']].map(([number,title,copy]) => <div key={number} className="rounded-[24px] border border-black/5 bg-white/70 p-5"><div className="text-xs font-semibold text-red-600">{number}</div><h3 className="mt-5 text-sm font-semibold">{title}</h3><p className="mt-1.5 text-xs leading-5 text-slate-500">{copy}</p></div>)}</div>
        </div>
      </section>
    </main>

    <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-[11px] text-slate-600 sm:px-8">
      <span>Unofficial UMD planning tool. Always verify in Testudo.</span>
      <span className="flex flex-wrap items-center gap-4"><button type="button" onClick={() => onLegalPage('privacy')} className="font-semibold text-slate-700 hover:text-black">Privacy</button><button type="button" onClick={() => onLegalPage('terms')} className="font-semibold text-slate-700 hover:text-black">Terms &amp; disclaimer</button><button type="button" onClick={onStart} className="font-semibold text-slate-700 hover:text-black">Open planner →</button></span>
    </footer>
    {authMode && <AuthDialog mode={authMode} onClose={() => setAuthMode(null)} onLegalPage={(page) => { setAuthMode(null); onLegalPage(page); }} />}
  </div>;
};
