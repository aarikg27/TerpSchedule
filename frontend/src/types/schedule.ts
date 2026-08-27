export interface Meeting {
  day: string;
  start: string;
  end: string;
  building?: string | null;
  building_name?: string | null;
  building_latitude?: number | null;
  building_longitude?: number | null;
  room?: string | null;
  class_type?: string | null;
  next_course_id?: string | null;
  next_building?: string | null;
  next_building_name?: string | null;
  next_building_latitude?: number | null;
  next_building_longitude?: number | null;
  next_room?: string | null;
  next_start?: string | null;
  walk_to_next_minutes?: number | null;
  walk_to_next_meters?: number | null;
}

export interface Section {
  course_id: string;
  section_id: string;
  instructor?: string | null;
  rating?: number | null;
  gpa?: number | null;
  gpa_available: boolean;
  credits: number;
  seats_total: number;
  open_seats: number;
  waitlist_count: number;
  availability: 'open' | 'waitlist_or_closed';
  meetings: Meeting[];
}

export interface ScheduleMetrics {
  avg_professor_rating: number;
  avg_gpa: number | null;
  gpa_sections_with_data: number;
  gpa_sections_total: number;
  total_credits: number;
  total_gap_minutes: number;
  active_days: number;
  max_walk_time_mins: number;
  open_sections: number;
  unavailable_sections: number;
  registerable_now: boolean;
}

export interface RankedSchedule {
  rank: number;
  total_score: number;
  metrics: ScheduleMetrics;
  sections: Section[];
  customized?: boolean;
}

export interface OptimizeResponse {
  total_combinations_checked: number;
  valid_schedules_count: number;
  execution_time_ms: number;
  total_request_time_ms?: number;
  schedules: RankedSchedule[];
  registerable_schedules_count: number;
  waitlist_schedules_count: number;
  open_schedules: RankedSchedule[];
  waitlist_schedules: RankedSchedule[];
  section_options_by_course: Record<string, number>;
  search_space_size: number;
  search_complete: boolean;
  applied_constraints: string[];
}

export interface Constraints {
  earliest_start_time: number;
  latest_end_time: number;
  blocked_days: string[];
  max_gap_minutes: number | null;
  avoid_professors: string[];
  preferred_instructors: Record<string, string[]>;
  availability: 'all' | 'open_only' | 'waitlist_only';
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

export interface CourseSectionResult {
  section_id: string;
  course_id: string;
  instructor?: string | null;
  avg_rating?: number | null;
  avg_gpa?: number | null;
  seats_total: number;
  open_seats: number;
  waitlist_count: number;
  meetings: Array<{
    day: string;
    start_time: string;
    end_time: string;
    building?: string | null;
    room?: string | null;
    class_type?: string | null;
  }>;
}

export interface CourseDetail extends CourseSearchResult {
  description?: string | null;
  sections: CourseSectionResult[];
}
