import type { CourseSearchResult, OptimizeRequest, OptimizeResponse } from '../types/schedule';

const API_BASE = '/api/v1';

export async function searchCourses(query: string): Promise<CourseSearchResult[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${API_BASE}/courses?search=${encodeURIComponent(query)}`);
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

export function getIcalDownloadUrl(sectionStrings: string[]): string {
  return `${API_BASE}/export/ical?sections=${encodeURIComponent(sectionStrings.join(','))}`;
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
