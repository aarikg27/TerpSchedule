export interface Meeting {
  day: string;
  start: string;
  end: string;
  building?: string | null;
  room?: string | null;
}

export interface Section {
  course_id: string;
  section_id: string;
  instructor?: string | null;
  rating?: number | null;
  gpa?: number | null;
  meetings: Meeting[];
}

export interface ScheduleMetrics {
  avg_professor_rating: number;
  avg_gpa: number;
  total_gap_minutes: number;
  active_days: number;
  max_walk_time_mins: number;
}

export interface RankedSchedule {
  rank: number;
  total_score: number;
  metrics: ScheduleMetrics;
  sections: Section[];
}

export interface OptimizeResponse {
  total_combinations_checked: number;
  valid_schedules_count: number;
  execution_time_ms: number;
  schedules: RankedSchedule[];
}

export interface Constraints {
  earliest_start_time: number;
  latest_end_time: number;
  blocked_days: string[];
  max_gap_minutes: number | null;
  avoid_professors: string[];
  target_campus_days: number;
}

export interface Weights {
  professor_quality: number;
  compactness: number;
  campus_days: number;
  transit_ease: number;
}

export type PreferenceCriterion = keyof Weights;

export interface PreferenceRank {
  criterion: PreferenceCriterion;
  rank: number;
}

export interface OptimizeRequest {
  courses: string[];
  term?: string;
  constraints: Constraints;
  weights: Weights;
  preference_ranking?: PreferenceRank[];
}

export interface CourseSearchResult {
  course_id: string;
  department: string;
  name: string;
  credits: number;
}
