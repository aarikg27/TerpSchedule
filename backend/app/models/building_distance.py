from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class BuildingDistance(Base):
    __tablename__ = "building_distances"
    origin: Mapped[str] = mapped_column(String(10), primary_key=True)
    destination: Mapped[str] = mapped_column(String(10), primary_key=True)
    walk_minutes: Mapped[int]
