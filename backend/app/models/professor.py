from typing import Optional, TYPE_CHECKING
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

if TYPE_CHECKING:
    from app.models.section import Section

class Professor(Base):
    __tablename__ = "professors"
    name: Mapped[str] = mapped_column(String(100), primary_key=True)
    slug: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    average_rating: Mapped[float] = mapped_column(default=0.0)
    total_reviews: Mapped[int] = mapped_column(default=0)
    sections: Mapped[list["Section"]] = relationship(back_populates="professor_rel")
