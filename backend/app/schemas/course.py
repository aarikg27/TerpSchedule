from pydantic import BaseModel

def minutes_to_time_str(minutes: int) -> str:
    """Convert minutes from midnight to 'HH:MM' format."""
    h, m = divmod(minutes, 60)
    return f"{h:02d}:{m:02d}"

class MeetingResponse(BaseModel):
    day: str
    start_time: str
    end_time: str
    building: str | None = None
    room: str | None = None
    class_type: str | None = None

class SectionResponse(BaseModel):
    section_id: str
    course_id: str
    instructor: str | None = None
    avg_rating: float | None = None
    avg_gpa: float | None = None
    seats_total: int
    open_seats: int
    waitlist_count: int
    meetings: list[MeetingResponse]

class CourseResponse(BaseModel):
    course_id: str
    department: str
    name: str
    credits: int
    description: str | None = None
    sections: list[SectionResponse] = []

class CourseSearchResult(BaseModel):
    course_id: str
    department: str
    name: str
    credits: int
