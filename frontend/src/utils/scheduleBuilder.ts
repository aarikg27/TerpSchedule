import type { Meeting, RankedSchedule, ScheduleMetrics, Section } from '../types/schedule';

const minute = (value: string) => {
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
};

export function meetingsConflict(left: Meeting, right: Meeting): boolean {
  if (left.day === 'ONLINE' || right.day === 'ONLINE' || left.day !== right.day) return false;
  return minute(left.start) < minute(right.end) && minute(right.start) < minute(left.end);
}

export function conflictingSections(candidate: Section, sections: Section[]): Section[] {
  return sections.filter((existing) => existing.meetings.some((left) => candidate.meetings.some((right) => meetingsConflict(left, right))));
}

function withTransitions(sections: Section[]): Section[] {
  const copied = sections.map((section) => ({
    ...section,
    meetings: section.meetings.map((meeting): Meeting => ({
      ...meeting,
      next_course_id: null,
      next_building: null,
      next_building_name: null,
      next_building_latitude: null,
      next_building_longitude: null,
      next_room: null,
      next_start: null,
      walk_to_next_minutes: null,
      walk_to_next_meters: null,
    })),
  }));
  for (const day of ['M', 'Tu', 'W', 'Th', 'F']) {
    const meetings = copied.flatMap((section) => section.meetings.filter((meeting) => meeting.day === day).map((meeting) => ({ section, meeting }))).sort((a, b) => minute(a.meeting.start) - minute(b.meeting.start));
    for (let index = 0; index < meetings.length - 1; index += 1) {
      const current = meetings[index].meeting;
      const next = meetings[index + 1];
      current.next_course_id = next.section.course_id;
      current.next_building = next.meeting.building;
      current.next_room = next.meeting.room;
      current.next_start = next.meeting.start;
    }
  }
  return copied;
}

export function calculateMetrics(sections: Section[]): ScheduleMetrics {
  const ratings = sections.map((section) => section.rating).filter((value): value is number => value != null && value > 0);
  const gpas = sections.filter((section) => section.gpa_available && section.gpa != null).map((section) => section.gpa as number);
  const days = new Set(sections.flatMap((section) => section.meetings.map((meeting) => meeting.day)).filter((day) => day !== 'ONLINE'));
  let totalGapMinutes = 0;
  for (const day of days) {
    const meetings = sections.flatMap((section) => section.meetings.filter((meeting) => meeting.day === day)).sort((a, b) => minute(a.start) - minute(b.start));
    for (let index = 1; index < meetings.length; index += 1) totalGapMinutes += Math.max(0, minute(meetings[index].start) - minute(meetings[index - 1].end));
  }
  const openSections = sections.filter((section) => section.open_seats > 0).length;
  return {
    avg_professor_rating: ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0,
    avg_gpa: gpas.length ? gpas.reduce((sum, value) => sum + value, 0) / gpas.length : null,
    gpa_sections_with_data: gpas.length,
    gpa_sections_total: sections.length,
    total_credits: sections.reduce((sum, section) => sum + section.credits, 0),
    total_gap_minutes: totalGapMinutes,
    active_days: days.size,
    max_walk_time_mins: 0,
    open_sections: openSections,
    unavailable_sections: sections.length - openSections,
    registerable_now: sections.length > 0 && openSections === sections.length,
  };
}

export function customizeSchedule(_schedule: RankedSchedule | null, sections: Section[]): RankedSchedule {
  const transitioned = withTransitions(sections);
  return { rank: 0, total_score: 0, sections: transitioned, metrics: calculateMetrics(transitioned), customized: true };
}
