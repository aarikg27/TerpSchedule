import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CourseSearch } from './components/CourseSearch';
import { ConstraintPanel } from './components/ConstraintPanel';
import { WeightSliders } from './components/WeightSliders';
import { CalendarGrid } from './components/CalendarGrid';
import { ScheduleRanking } from './components/ScheduleRanking';
import { DirectRegistration } from './components/DirectRegistration';
import type { Constraints, Weights, PreferenceRank, OptimizeResponse, RankedSchedule } from './types/schedule';
import { optimizeSchedules } from './api/client';
import { getAvailableTerms, type AvailableTerm } from './api/client';
import { AlertCircle, Calendar, Sliders, BarChart3 } from 'lucide-react';
import { LegalDialog, type LegalPage } from './components/LegalDialog';
import { LandingPage } from './components/LandingPage';
import { ScheduleActions } from './components/ScheduleActions';
import { DegreeAuditImporter } from './components/DegreeAuditImporter';
import { authClient, neonClient } from './auth';
import { loadPlannerState, savePlannerState } from './api/workspace';

export const App: React.FC = () => {
  const [term, setTerm] = useState('202608');
  const [terms, setTerms] = useState<AvailableTerm[]>([{ id: '202608', label: 'Fall 2026', has_data: true }]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([
    'CMSC132',
    'MATH240',
  ]);

  const [constraints, setConstraints] = useState<Constraints>({
    earliest_start_time: 480, // 8:00 AM
    latest_end_time: 1200,    // 8:00 PM
    blocked_days: [],
    max_gap_minutes: null,
    avoid_professors: [],
    preferred_instructors: {},
    availability: 'all',
    target_campus_days: 4,
  });

  const weights: Weights = {
    professor_quality: 0.4,
    compactness: 0.3,
    campus_days: 0.15,
    transit_ease: 0.15,
  };
  const [preferenceRanking, setPreferenceRanking] = useState<PreferenceRank[]>([
    { criterion: 'professor_quality', rank: 1 },
    { criterion: 'compactness', rank: 2 },
    { criterion: 'campus_days', rank: 3 },
    { criterion: 'transit_ease', rank: 4 },
  ]);

  const [optimizeResponse, setOptimizeResponse] = useState<OptimizeResponse | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<RankedSchedule | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'inputs' | 'grid' | 'ranking'>('grid');
  const [visibleMeetingTypes, setVisibleMeetingTypes] = useState<string[]>(['Lecture', 'Discussion', 'Lab', 'Online', 'Other']);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => (localStorage.getItem('terpschedule-theme') as 'light' | 'dark' | 'system') || 'system');
  const [legalPage, setLegalPage] = useState<LegalPage | null>(null);
  const [page, setPage] = useState<'landing' | 'planner'>(() => window.location.pathname === '/planner' ? 'planner' : 'landing');
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const session = authClient?.useSession();
  const workspaceUser = session?.data?.user;

  useEffect(() => {
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark-mode', dark);
    localStorage.setItem('terpschedule-theme', theme);
  }, [theme]);

  useEffect(() => {
    const onPopState = () => setPage(window.location.pathname === '/planner' ? 'planner' : 'landing');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    setWorkspaceReady(false);
    if (!workspaceUser || !neonClient) { setWorkspaceReady(true); return; }
    loadPlannerState().then((state) => {
      if (Array.isArray(state?.selectedCourses)) setSelectedCourses(state.selectedCourses as string[]);
      if (typeof state?.term === 'string') setTerm(state.term);
      if (state?.constraints && typeof state.constraints === 'object') setConstraints(state.constraints as Constraints);
      if (Array.isArray(state?.preferenceRanking)) setPreferenceRanking(state.preferenceRanking as PreferenceRank[]);
    }).catch(() => undefined).finally(() => setWorkspaceReady(true));
  }, [workspaceUser?.id]);

  useEffect(() => {
    if (!workspaceReady || !workspaceUser || !neonClient) return;
    const timer = window.setTimeout(() => {
      savePlannerState(workspaceUser.id, { selectedCourses, term, constraints, preferenceRanking }).catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [workspaceReady, workspaceUser?.id, selectedCourses, term, constraints, preferenceRanking]);

  useEffect(() => {
    const encoded = window.location.hash.startsWith('#share=') ? window.location.hash.slice(7) : '';
    if (!encoded) return;
    try {
      const shared = JSON.parse(decodeURIComponent(atob(encoded))) as { term: string; schedule: RankedSchedule };
      if (shared?.schedule?.sections?.length) { setTerm(shared.term); setActiveSchedule(shared.schedule); }
    } catch { setError('This shared schedule link is invalid or incomplete.'); }
  }, []);

  const openPlanner = () => { window.history.pushState({}, '', '/planner'); setPage('planner'); window.scrollTo(0, 0); };
  const openLanding = () => { window.history.pushState({}, '', '/'); setPage('landing'); window.scrollTo(0, 0); };
  const cycleLandingTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    getAvailableTerms().then((result) => { setTerms(result.terms); setTerm(result.selected_term); }).catch(() => undefined);
  }, []);

  const handleTermChange = (nextTerm: string) => {
    setTerm(nextTerm);
    setOptimizeResponse(null);
    setActiveSchedule(null);
    setError(null);
  };

  const handleAddCourse = (courseId: string) => {
    if (!selectedCourses.includes(courseId)) {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  const handleRemoveCourse = (courseId: string) => {
    setSelectedCourses(selectedCourses.filter((c) => c !== courseId));
  };

  const handleGenerate = async () => {
    if (selectedCourses.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const data = await optimizeSchedules({
        courses: selectedCourses,
        term,
        constraints,
        weights,
        preference_ranking: preferenceRanking,
      });

      setOptimizeResponse(data);
      setActiveSchedule(data.schedules[0] || null);
      if (data.valid_schedules_count === 0) {
        setError('No conflict-free schedules match your constraints. Try widening time limits or relaxing blocked days.');
      } else {
        setMobileTab('grid');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to optimize schedules');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut Ctrl/Cmd + Enter to trigger generate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCourses, constraints, preferenceRanking, term]);

  if (page === 'landing') return <LandingPage onStart={openPlanner} theme={theme} onToggleTheme={cycleLandingTheme} />;

  return (
    <div className="app-shell min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        term={term}
        activeSchedule={activeSchedule}
        theme={theme}
        onThemeChange={setTheme}
        terms={terms}
        onTermChange={handleTermChange}
        onHome={openLanding}
      />

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden flex border-b border-slate-800 bg-slate-900 px-4 py-2 gap-2 text-xs">
        <button
          onClick={() => setMobileTab('inputs')}
          className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 ${
            mobileTab === 'inputs' ? 'bg-red-600 text-white' : 'text-slate-400'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Inputs</span>
        </button>
        <button
          onClick={() => setMobileTab('grid')}
          className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 ${
            mobileTab === 'grid' ? 'bg-red-600 text-white' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendar</span>
        </button>
        <button
          onClick={() => setMobileTab('ranking')}
          className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 ${
            mobileTab === 'ranking' ? 'bg-red-600 text-white' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Rankings</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-4 lg:p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-950/70 border border-red-800 rounded-xl flex items-center gap-2.5 text-xs text-red-200 shadow-lg">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3-Column Desktop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANEL: Inputs, Constraints, Sliders */}
          <aside
            className={`lg:col-span-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overflow-x-hidden space-y-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl ${
              mobileTab !== 'inputs' ? 'hidden lg:block' : ''
            }`}
          >
            <CourseSearch
              term={term}
              selectedCourses={selectedCourses}
              onAddCourse={handleAddCourse}
              onRemoveCourse={handleRemoveCourse}
            />
            <DegreeAuditImporter onAddCourses={(courses) => setSelectedCourses((current) => [...new Set([...current, ...courses])])} />

            <ConstraintPanel
              constraints={constraints}
              onChange={setConstraints}
              selectedCourses={selectedCourses}
            />

            <WeightSliders
              ranking={preferenceRanking}
              onChange={setPreferenceRanking}
              onGenerate={handleGenerate}
              loading={loading}
              disabled={selectedCourses.length === 0}
            />
          </aside>

          {/* CENTER PANEL: Interactive Calendar Grid */}
          <section
            className={`lg:col-span-6 space-y-4 ${
              mobileTab !== 'grid' ? 'hidden lg:block' : ''
            }`}
          >
            <CalendarGrid schedule={activeSchedule} visibleMeetingTypes={visibleMeetingTypes} onVisibleMeetingTypesChange={setVisibleMeetingTypes} />
          </section>

          {/* RIGHT PANEL: Optimization Metrics, Radar, Rankings, Registration */}
          <aside
            className={`lg:col-span-3 space-y-4 ${
              mobileTab !== 'ranking' ? 'hidden lg:block' : ''
            }`}
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Top Ranked Schedules
                </span>
                {optimizeResponse && (
                  <span className="text-[10px] font-medium text-slate-500">
                    {optimizeResponse.valid_schedules_count.toLocaleString()} found · showing top {optimizeResponse.schedules.length}
                  </span>
                )}
              </div>

              <ScheduleRanking
                response={optimizeResponse}
                activeSchedule={activeSchedule}
                onSelectSchedule={setActiveSchedule}
              />
            </div>

            <DirectRegistration schedule={activeSchedule} />
            <ScheduleActions
              schedule={activeSchedule}
              term={term}
              onSelect={setActiveSchedule}
              onClose={() => setActiveSchedule(null)}
              onNew={() => { setActiveSchedule(null); setOptimizeResponse(null); setSelectedCourses([]); setError(null); setMobileTab('inputs'); }}
            />
          </aside>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-3 px-5 pb-6 text-[11px] text-slate-500">
        <span>Unofficial UMD planning tool · Always verify in Testudo.</span>
        <span className="flex gap-4"><button type="button" onClick={() => setLegalPage('privacy')} className="hover:text-slate-800">Privacy</button><button type="button" onClick={() => setLegalPage('terms')} className="hover:text-slate-800">Terms & disclaimer</button></span>
      </footer>
      {legalPage && <LegalDialog page={legalPage} onClose={() => setLegalPage(null)} />}

    </div>
  );
};

export default App;
