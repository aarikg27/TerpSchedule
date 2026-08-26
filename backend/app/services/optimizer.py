import time
from dataclasses import dataclass, field

from app.utils.bitmask import build_mask, DAYS, empty_day_masks, masks_conflict


@dataclass(slots=True)
class SolverMeeting:
    day: str
    start_min: int
    end_min: int
    building: str | None = None
    room: str | None = None
    class_type: str | None = None


@dataclass(slots=True)
class SolverSection:
    section_id: str
    course_id: str
    instructor: str | None = None
    avg_rating: float = 3.0
    avg_gpa: float = 3.0
    gpa_is_estimated: bool = True
    credits: int = 0
    seats_total: int = 0
    open_seats: int = 0
    waitlist_count: int = 0
    meetings: list[SolverMeeting] = field(default_factory=list)
    day_masks: dict[str, int] = field(default_factory=dict)

    def precompute_masks(self) -> None:
        self.day_masks = {d: 0 for d in DAYS}
        for m in self.meetings:
            if m.day in self.day_masks:
                self.day_masks[m.day] |= build_mask(m.start_min, m.end_min)


class ScheduleOptimizer:
    """
    Backtracking CSP solver with bitmask conflict detection.
    Falls back to beam search when the search space is too large.
    """

    def __init__(
        self,
        course_sections: dict[str, list[SolverSection]],
        earliest_start: int = 480,
        latest_end: int = 1320,
        blocked_days: set[str] | None = None,
        max_gap_minutes: int | None = None,
        avoid_professors: set[str] | None = None,
        preferred_instructors: dict[str, set[str]] | None = None,
        availability: str = "all",
        building_distances: dict[tuple[str, str], int] | None = None,
        timeout_ms: int = 250,
        beam_threshold: int = 1_000_000,
    ):
        self.course_sections = course_sections
        self.course_ids = list(course_sections.keys())
        self.earliest_start = earliest_start
        self.latest_end = latest_end
        self.blocked_days = blocked_days or set()
        self.max_gap_minutes = max_gap_minutes
        self.avoid_professors = avoid_professors or set()
        self.preferred_instructors = preferred_instructors or {}
        self.availability = availability
        self.building_distances = building_distances or {}
        self.timeout_ms = timeout_ms
        self.beam_threshold = beam_threshold

        self.combinations_checked = 0
        self._start_time = 0.0
        self._timed_out = False

        for sections in self.course_sections.values():
            for section in sections:
                section.precompute_masks()

    def solve(self) -> list[list[SolverSection]]:
        if not self.course_ids:
            return []

        space_size = 1
        for sections in self.course_sections.values():
            space_size *= len(sections)

        self._start_time = time.perf_counter()
        self._timed_out = False
        self.combinations_checked = 0

        if space_size > self.beam_threshold:
            return self._beam_search()

        results: list[list[SolverSection]] = []
        self._backtrack(0, [], empty_day_masks(), results)
        return results

    @property
    def timed_out(self) -> bool:
        return self._timed_out

    def _check_timeout(self) -> bool:
        if self.combinations_checked % 1000 == 0:
            elapsed_ms = (time.perf_counter() - self._start_time) * 1000
            if elapsed_ms > self.timeout_ms:
                self._timed_out = True
                return True
        return False

    def _is_valid_section(
        self,
        section: SolverSection,
        current_masks: dict[str, int],
        current_schedule: list[SolverSection],
    ) -> bool:
        instructor_key = (section.instructor or '').casefold()
        if instructor_key and instructor_key in {name.casefold() for name in self.avoid_professors}:
            return False

        wanted = self.preferred_instructors.get(section.course_id, set())
        if wanted and instructor_key not in {name.casefold() for name in wanted}:
            return False

        if self.availability == "open_only" and section.open_seats <= 0:
            return False

        # O(1) bitmask conflict check per day
        for d, mask in section.day_masks.items():
            if masks_conflict(current_masks[d], mask):
                return False

        for m in section.meetings:
            if m.day == "ONLINE":
                continue
            if m.day in self.blocked_days:
                return False
            if m.start_min < self.earliest_start:
                return False
            if m.end_min > self.latest_end:
                return False

        # Max gap constraint
        if self.max_gap_minutes is not None:
            if not self._check_gap_constraint(section, current_schedule):
                return False

        return True

    def _check_gap_constraint(
        self, section: SolverSection, current_schedule: list[SolverSection]
    ) -> bool:
        day_intervals: dict[str, list[tuple[int, int]]] = {d: [] for d in DAYS}

        for s in current_schedule:
            for m in s.meetings:
                if m.day in day_intervals:
                    day_intervals[m.day].append((m.start_min, m.end_min))
        for m in section.meetings:
            if m.day in day_intervals:
                day_intervals[m.day].append((m.start_min, m.end_min))

        for intervals in day_intervals.values():
            if len(intervals) < 2:
                continue
            intervals.sort()
            for i in range(len(intervals) - 1):
                gap = intervals[i + 1][0] - intervals[i][1]
                if gap > self.max_gap_minutes:
                    return False
        return True

    def _backtrack(
        self,
        course_idx: int,
        current_schedule: list[SolverSection],
        current_masks: dict[str, int],
        results: list[list[SolverSection]],
    ):
        if self._timed_out:
            return

        self.combinations_checked += 1
        if self._check_timeout():
            return

        if course_idx == len(self.course_ids):
            results.append(list(current_schedule))
            return

        course_id = self.course_ids[course_idx]
        for section in self.course_sections[course_id]:
            if self._is_valid_section(section, current_masks, current_schedule):
                new_masks = current_masks.copy()
                for d, mask in section.day_masks.items():
                    new_masks[d] |= mask

                current_schedule.append(section)
                self._backtrack(course_idx + 1, current_schedule, new_masks, results)
                current_schedule.pop()

    def _beam_search(self, k: int = 500) -> list[list[SolverSection]]:
        """Keep top-k partial candidates at each depth, scored by avg professor rating."""
        candidates: list[tuple[list[SolverSection], dict[str, int]]] = [
            ([], empty_day_masks())
        ]

        for course_id in self.course_ids:
            if self._timed_out:
                break

            next_candidates = []
            for schedule, masks in candidates:
                for section in self.course_sections[course_id]:
                    self.combinations_checked += 1
                    if self._check_timeout():
                        return [c[0] for c in candidates if len(c[0]) == len(self.course_ids)]

                    if self._is_valid_section(section, masks, schedule):
                        new_masks = masks.copy()
                        for d, mask in section.day_masks.items():
                            new_masks[d] |= mask
                        next_candidates.append((schedule + [section], new_masks))

            next_candidates.sort(
                key=lambda x: sum(s.avg_rating for s in x[0]), reverse=True
            )
            candidates = next_candidates[:k]

        return [c[0] for c in candidates if len(c[0]) == len(self.course_ids)]
