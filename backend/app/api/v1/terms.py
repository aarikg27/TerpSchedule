from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Course, SyncState
from app.services.terms import current_term_id, sort_key, term_label

router = APIRouter()


@router.get("/terms")
async def available_terms(db: AsyncSession = Depends(get_db)):
    course_terms = set((await db.execute(select(Course.term_id).distinct())).scalars().all())
    state_keys = (await db.execute(select(SyncState.key).where(SyncState.key.like("soc:%")))).scalars().all()
    synced_terms = {key.split(":", 2)[1] for key in state_keys if len(key.split(":")) >= 3}
    terms = sorted(course_terms | synced_terms | {settings.DEFAULT_TERM}, key=sort_key, reverse=True)
    automatic = current_term_id()
    selected = automatic if automatic in terms else min(terms, key=lambda term: abs(sort_key(term)[0] * 4 + sort_key(term)[1] - (sort_key(automatic)[0] * 4 + sort_key(automatic)[1])))
    return {
        "selected_term": selected,
        "terms": [{"id": term, "label": term_label(term), "has_data": term in course_terms} for term in terms],
    }
