import React, { useState } from 'react';
import { ArrowRight, CalendarDays, Check, Clock3, Footprints, GraduationCap, Moon, Search, ShieldCheck, Star, Sun } from 'lucide-react';
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

const week = [
  { day: 'Mon', classes: [['CMSC132', '9:00', 'IRB'], ['STAT400', '1:00', 'ESJ']] },
  { day: 'Tue', classes: [['MATH240', '10:00', 'MTH']] },
  { day: 'Wed', classes: [['CMSC132', '9:00', 'IRB'], ['STAT400', '1:00', 'ESJ']] },
  { day: 'Thu', classes: [['MATH240', '10:00', 'MTH']] },
  { day: 'Fri', classes: [['CMSC132', '9:00', 'IRB']] },
];

const classColor: Record<string, string> = {
  CMSC132: 'border-red-200 bg-red-50 text-red-700',
  MATH240: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  STAT400: 'border-cyan-200 bg-cyan-50 text-cyan-700',
};

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, theme, onToggleTheme, onLegalPage }) => {
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up' | null>(null);
  const session = authClient?.useSession();

  return <div className="landing-page min-h-screen overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
    <header className="landing-nav sticky top-0 z-40 border-b border-transparent">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <button type="button" onClick={onStart} className="group flex items-center gap-2.5" aria-label="Open TerpSchedule planner">
          <BrandMark className="h-9 w-9 shrink-0 transition-transform duration-300 group-hover:-rotate-3" />
          <span className="text-lg font-semibold tracking-tight">TerpSchedule</span>
        </button>
        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={onToggleTheme} aria-label={`Switch from ${theme} theme`} className="rounded-full p-2.5 text-slate-500 hover:bg-black/5">{theme === 'dark' ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}</button>
          {session?.data?.user
            ? <button type="button" onClick={onStart} className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">Open planner</button>
            : authClient && <><button type="button" onClick={() => setAuthMode('sign-in')} className="hidden rounded-full px-4 py-2 text-xs font-semibold hover:bg-black/5 sm:block">Sign in</button><button type="button" onClick={() => setAuthMode('sign-up')} className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">Create account</button></>}
        </div>
      </div>
    </header>

    <main>
      <section className="landing-hero border-0">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[.88fr_1.12fr] lg:pb-28 lg:pt-24">
          <div className="landing-rise">
            <p className="mb-5 text-sm font-semibold text-red-700">UMD schedule planning, without the spreadsheet.</p>
            <h1 className="max-w-xl text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-6xl">Build a week you can actually live with.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600">Add your courses, rule out the sections that do not work, and compare the schedules that are left. Seats, instructors, gaps, discussions, and walks stay in the same view.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button type="button" aria-label="Build my schedule" onClick={onStart} className="landing-primary-button group flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white">Start planning <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></button>
              <span className="text-xs text-slate-500">No account needed</span>
            </div>
            <div className="mt-9 grid max-w-md grid-cols-2 gap-x-5 gap-y-3 text-xs text-slate-600">
              {['Real section combinations', 'Open-seat filtering', 'Professor and GPA context', 'Degree-audit overview'].map((item) => <span key={item} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600"/>{item}</span>)}
            </div>
          </div>

          <div className="landing-preview relative mx-auto w-full max-w-2xl">
            <div className="rounded-[28px] border border-black/8 bg-white p-4 shadow-[0_30px_80px_rgba(0,0,0,.11)] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/6 pb-4">
                <div><div className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">Schedule 1 of 86</div><div className="mt-1 text-lg font-semibold">No early mornings · all sections open</div></div>
                <div className="flex gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold">14 credits</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700">Open now</span></div>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {week.map(({ day, classes }) => <div key={day} className="min-w-0"><div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">{day}</div><div className="h-64 space-y-2 rounded-xl bg-slate-50 p-1.5">{classes.map(([course, time, room]) => <div key={`${course}-${day}`} className={`landing-class-card rounded-lg border p-2 ${classColor[course]}`}><strong className="block truncate text-[10px] sm:text-xs">{course}</strong><span className="mt-1 block text-[9px] font-medium">{time}</span><span className="block truncate text-[9px] font-medium">{room}</span></div>)}</div></div>)}
              </div>
              <div className="mt-4 grid grid-cols-3 divide-x divide-black/6 rounded-2xl border border-black/6">
                <div className="p-3"><Star className="h-3.5 w-3.5 text-amber-500"/><strong className="mt-1.5 block text-sm">4.3 / 5</strong><span className="text-[9px] text-slate-500">Avg. instructor</span></div>
                <div className="p-3"><Clock3 className="h-3.5 w-3.5 text-blue-500"/><strong className="mt-1.5 block text-sm">50 min</strong><span className="text-[9px] text-slate-500">Longest gap</span></div>
                <div className="p-3"><Footprints className="h-3.5 w-3.5 text-purple-500"/><strong className="mt-1.5 block text-sm">8 min</strong><span className="text-[9px] text-slate-500">Longest walk</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white/60">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
            <div><p className="text-sm font-semibold text-red-600">What changes a schedule</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">The details are the whole point.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">Two schedules can contain the same courses and feel completely different by the second week.</p></div>
            <div className="divide-y divide-black/7 border-y border-black/7">
              {[[CalendarDays, 'Class and discussion times', 'Lectures, labs, and discussions stay visually distinct.'], [Star, 'Instructor context', 'Compare available ratings and historical course GPA without leaving the schedule.'], [Footprints, 'Time between buildings', 'See estimated transitions and open walking directions when the route matters.'], [ShieldCheck, 'Seats you can act on', 'Separate schedules you can register for now from options that may require a waitlist.']].map(([Icon, title, copy]) => { const C = Icon as typeof CalendarDays; return <div key={String(title)} className="grid gap-3 py-5 sm:grid-cols-[40px_190px_1fr] sm:items-center"><C className="h-5 w-5 text-slate-500"/><h3 className="text-sm font-semibold">{String(title)}</h3><p className="text-sm leading-6 text-slate-500">{String(copy)}</p></div>; })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-0">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="rounded-[28px] bg-[#1d1d1f] px-6 py-10 text-white sm:px-10 sm:py-12">
            <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]"><div><GraduationCap className="h-6 w-6 text-red-400"/><h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Have your course list ready?</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Search by course code, choose what matters, then adjust any result by hand.</p></div><button type="button" onClick={onStart} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Open the planner <Search className="h-4 w-4"/></button></div>
          </div>
        </div>
      </section>
    </main>

    <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-[11px] text-slate-600 sm:px-8">
      <span>Unofficial UMD planning tool. Always verify in Testudo.</span>
      <span className="flex items-center gap-4"><button type="button" onClick={() => onLegalPage('privacy')} className="font-semibold hover:text-black">Privacy</button><button type="button" onClick={() => onLegalPage('terms')} className="font-semibold hover:text-black">Terms</button><button type="button" onClick={onStart} className="font-semibold hover:text-black">Planner</button></span>
    </footer>
    {authMode && <AuthDialog mode={authMode} onClose={() => setAuthMode(null)} onLegalPage={(page) => { setAuthMode(null); onLegalPage(page); }} />}
  </div>;
};
