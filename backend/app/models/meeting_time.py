from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.section import Section

class MeetingTime(Base):
    __tablename__ = "meeting_times"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    section_pk: Mapped[int] = mapped_column(ForeignKey("sections.id", ondelete="CASCADE"))
    day: Mapped[str] = mapped_column(String(10))
    start_time: Mapped[int]
    end_time: Mapped[int]
    building: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    room: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    class_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    section: Mapped["Section"] = relationship(back_populates="meetings")
