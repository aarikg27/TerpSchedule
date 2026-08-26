from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class SyncState(Base):
    __tablename__ = "sync_states"

    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    last_success_at: Mapped[datetime]
    records_updated: Mapped[int] = mapped_column(default=0)
    status: Mapped[str] = mapped_column(String(20), default="ready")
