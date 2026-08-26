import type { CourseSearchResult, OptimizeRequest, OptimizeResponse } from '../types/schedule';

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '');
const API_BASE = `${API_ORIGIN}/api/v1`;

export async function searchCourses(query: string, term?: string): Promise<CourseSearchResult[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({ search: query });
  if (term) params.set('term', term);
  const res = await fetch(`${API_BASE}/courses?${params}`);
  if (!res.ok) {
    throw new Error(`Failed to search courses: ${res.statusText}`);
  }
  return res.json();
}

export async function optimizeSchedules(request: OptimizeRequest): Promise<OptimizeResponse> {
  const res = await fetch(`${API_BASE}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Optimization failed');
  }
  return res.json();
}

export function getIcalDownloadUrl(sectionStrings: string[], term?: string): string {
  const params = new URLSearchParams({ sections: sectionStrings.join(',') });
  if (term) params.set('term', term);
  return `${API_BASE}/export/ical?${params}`;
}

export interface AvailableTerm { id: string; label: string; has_data: boolean }
export async function getAvailableTerms(): Promise<{ selected_term: string; terms: AvailableTerm[] }> {
  const res = await fetch(`${API_BASE}/terms`);
  if (!res.ok) throw new Error('Could not load available semesters');
  return res.json();
}

export async function triggerIngest(term: string, departments: string[]): Promise<{ courses: number; sections: number; professors: number }> {
  const res = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ term, departments }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Ingestion failed' }));
    throw new Error(err.detail || 'Ingestion failed');
  }
  return res.json();
}

export interface SyncStatus {
  term: string;
  automatic: boolean;
  last_course_sync: string | null;
  departments_ready: number;
  walking_last_sync: string | null;
  walking_pairs: number;
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const res = await fetch(`${API_BASE}/sync-status`);
  if (!res.ok) throw new Error('Could not read sync status');
  return res.json();
}
