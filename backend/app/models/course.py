from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.section import Section

class Course(Base):
    __tablename__ = "courses"
    term_id: Mapped[str] = mapped_column(String(6), primary_key=True, default="202608")
    course_id: Mapped[str] = mapped_column(String(10), primary_key=True)
    department: Mapped[str] = mapped_column(String(4))
    name: Mapped[str] = mapped_column(String(255))
    credits: Mapped[int]
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sections: Mapped[list["Section"]] = relationship(back_populates="course", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        kwargs.setdefault("term_id", "202608")
        super().__init__(**kwargs)
