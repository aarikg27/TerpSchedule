from typing import Self
from pydantic import BaseModel, model_validator, field_validator

class Constraints(BaseModel):
    earliest_start_time: int = 480
    latest_end_time: int = 1320
    blocked_days: list[str] = []
    max_gap_minutes: int | None = None
    avoid_professors: list[str] = []
    preferred_instructors: dict[str, list[str]] = {}
    availability: str = 'all'
    target_campus_days: int = 5

    @field_validator('availability')
    @classmethod
    def valid_availability(cls, value: str) -> str:
        if value not in {'all', 'open_only', 'waitlist_only'}:
            raise ValueError('Availability must be all, open_only, or waitlist_only')
        return value

class Weights(BaseModel):
    professor_quality: float = 0.25
    compactness: float = 0.25
    campus_days: float = 0.25
    transit_ease: float = 0.25

    @model_validator(mode='after')
    def weights_must_be_positive(self) -> Self:
        if self.professor_quality < 0 or self.compactness < 0 or self.campus_days < 0 or self.transit_ease < 0:
            raise ValueError('All weights must be non-negative')
        return self

class PreferenceRank(BaseModel):
    criterion: str
    rank: int

    @field_validator('criterion')
    @classmethod
    def valid_criterion(cls, value: str) -> str:
        allowed = {'professor_quality', 'compactness', 'campus_days', 'transit_ease'}
        if value not in allowed:
            raise ValueError('Unknown preference criterion')
        return value

    @field_validator('rank')
    @classmethod
    def valid_rank(cls, value: int) -> int:
        if value < 1 or value > 4:
            raise ValueError('Preference rank must be between 1 and 4')
        return value

class OptimizeRequest(BaseModel):
    courses: list[str]
    term: str = "202608"
    constraints: Constraints = Constraints()
    weights: Weights = Weights()
    preference_ranking: list[PreferenceRank] | None = None

    def scoring_weights(self) -> dict[str, float]:
        if not self.preference_ranking:
            return self.weights.model_dump()
        ranks = {item.criterion: item.rank for item in self.preference_ranking}
        return {
            criterion: 1.0 / ranks.get(criterion, 4)
            for criterion in ('professor_quality', 'compactness', 'campus_days', 'transit_ease')
        }

    @field_validator('courses')
    @classmethod
    def at_least_one_course(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError('Must provide at least one course')
        return [c.upper().strip() for c in v]

class ScheduleMetrics(BaseModel):
    avg_professor_rating: float
    avg_gpa: float
    total_gap_minutes: int
    active_days: int
    max_walk_time_mins: int
    open_sections: int
    unavailable_sections: int
    registerable_now: bool

class MeetingResult(BaseModel):
    day: str
    start: str
    end: str
    building: str | None = None
    room: str | None = None
    class_type: str | None = None

class SectionResult(BaseModel):
    course_id: str
    section_id: str
    instructor: str | None = None
    rating: float | None = None
    gpa: float | None = None
    seats_total: int
    open_seats: int
    waitlist_count: int
    availability: str
    meetings: list[MeetingResult]

class RankedSchedule(BaseModel):
    rank: int
    total_score: float
    metrics: ScheduleMetrics
    sections: list[SectionResult]

class OptimizeResponse(BaseModel):
    total_combinations_checked: int
    valid_schedules_count: int
    execution_time_ms: float
    schedules: list[RankedSchedule]
