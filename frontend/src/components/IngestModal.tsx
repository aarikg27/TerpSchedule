import React, { useState } from 'react';
import { X, School, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { triggerIngest } from '../api/client';

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  term: string;
}

const POPULAR_DEPTS = ['CMSC', 'MATH', 'STAT', 'ENGL', 'PHYS', 'BMGT', 'COMM', 'PSYC'];

export const IngestModal: React.FC<IngestModalProps> = ({
  isOpen,
  onClose,
  term,
}) => {
  const [departments, setDepartments] = useState<string[]>(['CMSC', 'MATH']);
  const [customDept, setCustomDept] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    courses: number;
    sections: number;
    professors: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleDept = (dept: string) => {
    setDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const handleAddCustom = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customDept.trim()) {
      e.preventDefault();
      const code = customDept.trim().toUpperCase();
      if (!departments.includes(code)) {
        setDepartments((prev) => [...prev, code]);
      }
      setCustomDept('');
    }
  };

  const handleRunSync = async () => {
    if (departments.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const summary = await triggerIngest(term, departments);
      setResult(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to sync with Testudo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-950 border border-red-800/80 text-red-400">
              <School className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sync Testudo Data</h3>
              <p className="text-xs text-slate-400">Pull latest SOC & PlanetTerp ratings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">
              Academic Term
            </label>
            <input
              type="text"
              value={term}
              disabled
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              Select Academic Departments
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {POPULAR_DEPTS.map((dept) => {
                const isSelected = departments.includes(dept);
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDept(dept)}
                    className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-950 border-red-600 text-red-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {dept}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={customDept}
              onChange={(e) => setCustomDept(e.target.value)}
              onKeyDown={handleAddCustom}
              placeholder="Or type department code (e.g. BIOE) & Enter..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-red-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-lg space-y-1 text-xs text-emerald-200">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sync Succeeded!</span>
              </div>
              <div className="font-mono text-[11px] text-emerald-300/80">
                Courses: {result.courses} • Sections: {result.sections} • Instructors: {result.professors}
              </div>
              <p className="text-[11px] text-emerald-200/70">
                Section meeting times were refreshed and are ready for schedule generation.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleRunSync}
            disabled={loading || departments.length === 0}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              loading || departments.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-md'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <span>Start Ingest</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
