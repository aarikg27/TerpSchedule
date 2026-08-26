from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Building(Base):
    __tablename__ = "buildings"

    code: Mapped[str] = mapped_column(String(10), primary_key=True)
    building_id: Mapped[str | None] = mapped_column(String(10), nullable=True)
    name: Mapped[str]
    latitude: Mapped[float]
    longitude: Mapped[float]
    source: Mapped[str] = mapped_column(String(40), default="umd_campus_gis")
    updated_at: Mapped[datetime]
