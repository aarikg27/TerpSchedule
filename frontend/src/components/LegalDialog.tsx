import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useModalDialog } from '../hooks/useModalDialog';

export type LegalPage = 'privacy' | 'terms';

export const LegalDialog: React.FC<{ page: LegalPage; onClose: () => void }> = ({ page, onClose }) => {
  const dialogRef = useRef<HTMLElement>(null);
  useModalDialog(dialogRef, onClose);

  return createPortal(<div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <article ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={page === 'privacy' ? 'Privacy policy' : 'Terms and disclaimer'} className="legal-dialog max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-black/10 bg-white p-6 shadow-2xl outline-none sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div><div className="text-xs font-semibold uppercase tracking-[.16em] text-red-600">TerpSchedule</div><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{page === 'privacy' ? 'Privacy' : 'Terms & disclaimer'}</h2></div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full bg-slate-100 p-2 text-slate-600"><X className="h-4 w-4" /></button>
      </div>
      {page === 'privacy' ? (
        <div className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
          <p className="text-xs text-slate-500"><strong>Effective and last updated:</strong> August 27, 2026</p>
          <section><h3 className="font-semibold text-slate-900">What TerpSchedule collects</h3><p className="mt-1">You can use the planner without an account. If you create one, Neon Auth processes your name, email address, authentication provider, account identifier, and session information. TerpSchedule stores the schedules, course selections, constraints, preference order, and structured degree-audit analysis you choose to sync.</p></section>
          <section><h3 className="font-semibold text-slate-900">Degree audits</h3><p className="mt-1">A degree-audit PDF may contain your name, university identifier, program, courses, grades, and other education records. The file is sent to the TerpSchedule backend only to parse that request and is not intentionally retained. Identity fields are not included in the saved analysis; the resulting structured academic-planning summary is kept on your device as a guest or in your account when signed in. Uploading a newer audit replaces the saved summary.</p></section>
          <section><h3 className="font-semibold text-slate-900">Technical information</h3><p className="mt-1">Service providers may process IP addresses, device and browser information, authentication tokens, request timestamps, and limited diagnostic logs to deliver and protect TerpSchedule. Outside information already present in a degree-audit upload, TerpSchedule does not request device location, Testudo credentials, or registration credentials.</p></section>
          <section><h3 className="font-semibold text-slate-900">How information is used and shared</h3><p className="mt-1">Information is used only to authenticate users, sync requested planning data, generate schedules, prevent abuse, and maintain the service. Infrastructure providers process data on TerpSchedule’s behalf. Google receives information when you choose Google sign-in or open Google Maps. Public course-data providers receive server-side data requests, not your account identity. TerpSchedule does not sell personal data, use targeted advertising, or run advertising or behavioral analytics trackers.</p></section>
          <section><h3 className="font-semibold text-slate-900">Retention and deletion</h3><p className="mt-1">Guest data remains in browser storage until you clear it or your browser removes it. Synced planning data remains until you clear it or delete your account. Account &amp; data settings can permanently delete saved schedules, planner state, and the structured audit analysis, followed by the authentication account. Infrastructure providers may retain limited security logs, deletion records, or backups for their standard retention periods.</p></section>
          <section><h3 className="font-semibold text-slate-900">Security</h3><p className="mt-1">Account-owned database rows use row-level security, connections use HTTPS, administrative refresh operations require a secret token, and requests are rate limited. No online service can guarantee absolute security; report suspected security or privacy problems promptly.</p></section>
          <section><h3 className="font-semibold text-slate-900">Children</h3><p className="mt-1">TerpSchedule is a college-planning service and is not directed to children under 13. Do not create an account if you are under 13.</p></section>
          <section><h3 className="font-semibold text-slate-900">Your choices</h3><p className="mt-1">You may use the service as a guest, clear an individual audit or schedule, clear all synced planning data, or delete your account from Account &amp; data settings.</p></section>
        </div>
      ) : (
        <div className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
          <p className="text-xs text-slate-500"><strong>Effective and last updated:</strong> August 27, 2026</p>
          <section><h3 className="font-semibold text-slate-900">Agreement and eligibility</h3><p className="mt-1">By using TerpSchedule, you agree to these terms and the Privacy Policy. You must be at least 13 to create an account. If you do not agree, do not use the service.</p></section>
          <section><h3 className="font-semibold text-slate-900">Unofficial planning tool</h3><p className="mt-1">TerpSchedule is an independent planning tool and is not affiliated with, sponsored by, or endorsed by the University of Maryland. Testudo, the official UMD degree audit, and university advisors are authoritative.</p></section>
          <section><h3 className="font-semibold text-slate-900">No registration or academic guarantee</h3><p className="mt-1">Schedules are suggestions, not registration guarantees or academic advice. Always verify section times, seats, waitlists, prerequisites, permissions, restrictions, final exams, degree requirements, deadlines, and registration eligibility through official UMD systems. TerpSchedule cannot enroll you in a course.</p></section>
          <section><h3 className="font-semibold text-slate-900">Data limitations</h3><p className="mt-1">Course and seat information can become stale or be parsed incorrectly. A zero-seat section may be waitlistable or closed. Instructor ratings and GPA history may be incomplete or unavailable. Walking values are estimates based on building information, not live pedestrian routes. Third-party links and services have their own terms and policies.</p></section>
          <section><h3 className="font-semibold text-slate-900">Acceptable use</h3><p className="mt-1">Upload only a degree audit or other file that belongs to you or that you are authorized to process. Do not abuse, disrupt, probe, overload, or use automated requests against the service or its upstream data sources; bypass access controls or rate limits; upload malicious files; impersonate UMD or another person; or use TerpSchedule unlawfully. Access may be limited or terminated to protect users and infrastructure.</p></section>
          <section><h3 className="font-semibold text-slate-900">Accounts and availability</h3><p className="mt-1">Accounts are optional. You are responsible for protecting your credentials. The service may change, experience delays, lose availability, or be discontinued. You may delete your account from Account &amp; data settings.</p></section>
          <section><h3 className="font-semibold text-slate-900">Disclaimer and liability</h3><p className="mt-1">To the maximum extent permitted by law, TerpSchedule is provided “as is” and “as available,” without warranties of accuracy, availability, fitness for a particular purpose, or noninfringement. TerpSchedule is not liable for registration outcomes, missed requirements, schedule conflicts, lost data, or indirect or consequential damages resulting from use of the service. Nothing here excludes rights or liability that cannot legally be excluded.</p></section>
          <section><h3 className="font-semibold text-slate-900">Changes and governing law</h3><p className="mt-1">These terms may be updated as the beta changes; the effective date above will be revised for material updates. Maryland law governs these terms without regard to conflict-of-law principles.</p></section>
        </div>
      )}
    </article>
  </div>, document.body);
};
