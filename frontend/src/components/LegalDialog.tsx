import React from 'react';
import { X } from 'lucide-react';

export type LegalPage = 'privacy' | 'terms';

export const LegalDialog: React.FC<{ page: LegalPage; onClose: () => void }> = ({ page, onClose }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <article role="dialog" aria-modal="true" aria-label={page === 'privacy' ? 'Privacy policy' : 'Terms and disclaimer'} className="legal-dialog max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-black/10 bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div><div className="text-xs font-semibold uppercase tracking-[.16em] text-red-600">TerpSchedule</div><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{page === 'privacy' ? 'Privacy' : 'Terms & disclaimer'}</h2></div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full bg-slate-100 p-2 text-slate-600"><X className="h-4 w-4" /></button>
      </div>
      {page === 'privacy' ? (
        <div className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
          <p>TerpSchedule does not require an account. Without one, saved schedules remain on your device. If you sign in, schedules and planner preferences you choose to save are retained in your account so they can sync across devices.</p>
          <p>The service may keep short-lived operational logs such as request path, response status, duration, and network address for reliability and abuse prevention. It does not need your name, student ID, password, or registration credentials.</p>
          <p>Degree-audit PDFs are parsed for the current request and are not stored by TerpSchedule. The resulting course suggestions are not saved unless you explicitly add them to your planner. Calendar exports are generated on request.</p>
          <p>Account records are protected with database row-level security so authenticated users can access only rows assigned to their own user ID.</p>
          <p>No analytics or advertising trackers are enabled at launch.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
          <p>TerpSchedule is an unofficial planning tool and is not affiliated with or endorsed by the University of Maryland.</p>
          <p>Testudo is the authoritative source for section times, seats, registration eligibility, waitlists, and enrollment. Availability changes quickly; verify every section in Testudo before acting.</p>
          <p>Instructor metrics may be incomplete, and walking values are estimates based on campus building locations—not live pedestrian routes. Use the linked map for current directions.</p>
          <p>Schedules are suggestions, not registration guarantees. You remain responsible for prerequisites, permissions, restrictions, exams, and official deadlines.</p>
        </div>
      )}
    </article>
  </div>
);
