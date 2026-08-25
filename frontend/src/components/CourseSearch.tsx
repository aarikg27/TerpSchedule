import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, BookOpen, Sparkles, Loader2 } from 'lucide-react';
import type { CourseSearchResult } from '../types/schedule';
import { searchCourses } from '../api/client';

interface CourseSearchProps {
  selectedCourses: string[];
  onAddCourse: (courseId: string) => void;
  onRemoveCourse: (courseId: string) => void;
}

const POPULAR_COURSES = ['CMSC132', 'MATH240', 'STAT400', 'ENGL101', 'CMSC216', 'PHYS161'];

export const CourseSearch: React.FC<CourseSearchProps> = ({
  selectedCourses,
  onAddCourse,
  onRemoveCourse,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CourseSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchCourses(query);
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error('Failed to search courses:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (courseId: string) => {
    if (!selectedCourses.includes(courseId)) {
      onAddCourse(courseId);
    }
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      const upper = query.trim().toUpperCase();
      if (!selectedCourses.includes(upper)) {
        onAddCourse(upper);
      }
      setQuery('');
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-red-500" />
          <span>Target Courses</span>
        </label>
        <span className="text-[11px] text-slate-500 font-mono">
          {selectedCourses.length} selected
        </span>
      </div>

      {/* Input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim() && setIsOpen(true)}
            placeholder="Search e.g. CMSC132, Linear Algebra..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
          />
          {loading && (
            <Loader2 className="absolute right-3 w-4 h-4 text-slate-400 animate-spin" />
          )}
        </div>

        {/* Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto">
            {results.map((c) => {
              const isSelected = selectedCourses.includes(c.course_id);
              return (
                <button
                  key={c.course_id}
                  type="button"
                  onClick={() => handleSelect(c.course_id)}
                  disabled={isSelected}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors border-b border-slate-800/60 last:border-0 ${
                    isSelected
                      ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
                      : 'hover:bg-slate-800 text-slate-200 cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-2">
                      <span>{c.course_id}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {c.credits} cr
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      {c.name}
                    </div>
                  </div>
                  {isSelected ? (
                    <span className="text-[10px] text-emerald-400 font-medium">Added</span>
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Tags */}
      {selectedCourses.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedCourses.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 bg-red-950/60 border border-red-800/70 text-red-200 text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm"
            >
              <span>{c}</span>
              <button
                type="button"
                onClick={() => onRemoveCourse(c)}
                className="text-red-400 hover:text-white transition-colors"
                title={`Remove ${c}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="p-3 border border-dashed border-slate-800 rounded-lg text-center">
          <p className="text-xs text-slate-500">No courses selected yet</p>
        </div>
      )}

      {/* Quick Add Popular */}
      <div>
        <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Popular Courses</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {POPULAR_COURSES.map((c) => {
            const isSelected = selectedCourses.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => handleSelect(c)}
                disabled={isSelected}
                className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-red-500/70 hover:text-white cursor-pointer'
                }`}
              >
                + {c}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
