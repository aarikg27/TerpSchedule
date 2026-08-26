from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class BuildingDistance(Base):
    __tablename__ = "building_distances"
    origin: Mapped[str] = mapped_column(String(10), primary_key=True)
    destination: Mapped[str] = mapped_column(String(10), primary_key=True)
    walk_minutes: Mapped[int]
    distance_meters: Mapped[int | None] = mapped_column(nullable=True)
    source: Mapped[str] = mapped_column(String(40), default="legacy_seed")
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
