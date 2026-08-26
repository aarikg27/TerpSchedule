import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.config import settings
from app.database import async_session_maker
from app.models import SyncState
from app.services.ingest import run_full_ingest
from app.services.walking import refresh_walking_cache
from app.services.terms import current_term_id

logger = logging.getLogger(__name__)


async def _is_stale(key: str, max_age: timedelta) -> bool:
    async with async_session_maker() as session:
        state = await session.get(SyncState, key)
        if not state:
            return True
        return state.last_success_at < datetime.now(timezone.utc).replace(tzinfo=None) - max_age


async def refresh_stale_data() -> None:
    try:
        if await _is_stale("walking:umd-campus-gis", timedelta(days=settings.WALKING_REFRESH_DAYS)):
            await refresh_walking_cache()
    except Exception:
        logger.exception("Automatic walking cache refresh failed; cached fallbacks remain available")

    async with async_session_maker() as session:
        active_term = current_term_id()
        known = (await session.execute(select(SyncState.key).where(SyncState.key.like(f"soc:{active_term}:%")))).scalars().all()
    departments = set(settings.AUTO_SYNC_DEPARTMENTS)
    departments.update(key.rsplit(":", 1)[-1] for key in known)
    for department in sorted(departments):
        key = f"soc:{active_term}:{department}"
        try:
            if await _is_stale(key, timedelta(hours=settings.DATA_REFRESH_HOURS)):
                await run_full_ingest(active_term, [department], include_ratings=False)
        except Exception:
            logger.exception("Automatic SOC refresh failed for %s", department)


async def auto_sync_loop() -> None:
    while True:
        await refresh_stale_data()
        await asyncio.sleep(60 * 60)
