import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CourseSearch } from './components/CourseSearch';
import { ConstraintPanel } from './components/ConstraintPanel';
import { WeightSliders } from './components/WeightSliders';
import { CalendarGrid } from './components/CalendarGrid';
import { ScheduleRadar } from './components/ScheduleRadar';
import { ScheduleRanking } from './components/ScheduleRanking';
import { DirectRegistration } from './components/DirectRegistration';
import { IngestModal } from './components/IngestModal';
import type { Constraints, Weights, PreferenceRank, OptimizeResponse } from './types/schedule';
import { optimizeSchedules } from './api/client';
import { AlertCircle, Calendar, Sliders, BarChart3 } from 'lucide-react';

export const App: React.FC = () => {
  const term = '202608';
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
    { criterion: 'transit_ease', rank: 3 },
  ]);

  const [optimizeResponse, setOptimizeResponse] = useState<OptimizeResponse | null>(null);
  const [activeScheduleIndex, setActiveScheduleIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'inputs' | 'grid' | 'ranking'>('grid');
  const [visibleMeetingTypes, setVisibleMeetingTypes] = useState<string[]>(['Lecture', 'Discussion', 'Lab', 'Online', 'Other']);

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
      setActiveScheduleIndex(0);
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

  const activeSchedule =
    optimizeResponse && optimizeResponse.schedules.length > 0
      ? optimizeResponse.schedules[activeScheduleIndex] || null
      : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        term={term}
        activeSchedule={activeSchedule}
        onOpenIngestModal={() => setIsIngestModalOpen(true)}
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
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
            className={`lg:col-span-3 space-y-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl ${
              mobileTab !== 'inputs' ? 'hidden lg:block' : ''
            }`}
          >
            <CourseSearch
              selectedCourses={selectedCourses}
              onAddCourse={handleAddCourse}
              onRemoveCourse={handleRemoveCourse}
            />

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
            <ScheduleRadar schedule={activeSchedule} />

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Top Ranked Schedules
                </span>
                {optimizeResponse && (
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {optimizeResponse.schedules.length} found
                  </span>
                )}
              </div>

              <ScheduleRanking
                response={optimizeResponse}
                activeIndex={activeScheduleIndex}
                onSelectSchedule={setActiveScheduleIndex}
              />
            </div>

            <DirectRegistration schedule={activeSchedule} />
          </aside>
        </div>
      </main>

      {/* Testudo Sync Modal */}
      <IngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        term={term}
      />
    </div>
  );
};

export default App;
