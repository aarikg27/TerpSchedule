from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.professor import Professor
    from app.models.meeting_time import MeetingTime

class Section(Base):
    __tablename__ = "sections"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    section_id: Mapped[str] = mapped_column(String(10))
    course_id: Mapped[str] = mapped_column(ForeignKey("courses.course_id", ondelete="CASCADE"))
    instructor: Mapped[Optional[str]] = mapped_column(ForeignKey("professors.name"), nullable=True)
    seats_total: Mapped[int] = mapped_column(default=0)
    open_seats: Mapped[int] = mapped_column(default=0)
    waitlist_count: Mapped[int] = mapped_column(default=0)
    average_gpa: Mapped[float] = mapped_column(default=3.0)
    gpa_is_estimated: Mapped[bool] = mapped_column(default=True)
    
    course: Mapped["Course"] = relationship(back_populates="sections")
    professor_rel: Mapped[Optional["Professor"]] = relationship(back_populates="sections")
    meetings: Mapped[list["MeetingTime"]] = relationship(back_populates="section", cascade="all, delete-orphan")
    
    __table_args__ = (UniqueConstraint("course_id", "section_id", name="uq_course_section"),)
