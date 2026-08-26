import { neonClient } from '../auth';
import type { RankedSchedule } from '../types/schedule';

export interface SavedScheduleRecord {
  id: string;
  user_id: string;
  name: string;
  term: string;
  schedule: RankedSchedule;
  created_at: string;
  updated_at: string;
}

export async function loadCloudSchedules(): Promise<SavedScheduleRecord[]> {
  if (!neonClient) return [];
  const { data, error } = await neonClient.from('user_saved_schedules').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as unknown as SavedScheduleRecord[];
}

export async function saveCloudSchedule(record: Omit<SavedScheduleRecord, 'created_at' | 'updated_at'>): Promise<void> {
  if (!neonClient) return;
  const { error } = await neonClient.from('user_saved_schedules').insert(record);
  if (error) throw new Error(error.message);
}

export async function deleteCloudSchedule(id: string): Promise<void> {
  if (!neonClient) return;
  const { error } = await neonClient.from('user_saved_schedules').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function loadPlannerState(): Promise<Record<string, unknown> | null> {
  if (!neonClient) return null;
  const { data, error } = await neonClient.from('user_planner_states').select('state').maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.state as Record<string, unknown>) || null;
}

export async function savePlannerState(userId: string, state: Record<string, unknown>): Promise<void> {
  if (!neonClient) return;
  const { error } = await neonClient.from('user_planner_states').upsert({ id: userId, user_id: userId, state }, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
}
