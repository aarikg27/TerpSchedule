from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.services.ingest import run_full_ingest
from app.database import get_db
from app.models import SyncState
from app.config import settings
from app.services.terms import current_term_id

router = APIRouter()

class IngestRequest(BaseModel):
    term: str
    departments: list[str]

@router.post("/ingest")
async def ingest_data(request: IngestRequest, x_admin_token: str | None = Header(default=None)):
    if not settings.ADMIN_SYNC_TOKEN or x_admin_token != settings.ADMIN_SYNC_TOKEN:
        raise HTTPException(status_code=404, detail="Not found")
    try:
        result = await run_full_ingest(term_id=request.term, departments=request.departments)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Testudo sync failed: {exc}") from exc
    if result["courses"] > 0 and result["sections"] == 0:
        raise HTTPException(
            status_code=502,
            detail="Testudo returned courses but no sections. Nothing was marked as synced; try again in a moment.",
        )
    return result


@router.get("/sync-status")
async def sync_status(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SyncState))
    states = result.scalars().all()
    active_term = current_term_id()
    course_states = [state for state in states if state.key.startswith(f"soc:{active_term}:")]
    walking = next((state for state in states if state.key == "walking:umd-campus-gis"), None)
    latest_course_sync = max((state.last_success_at for state in course_states), default=None)
    return {
        "term": active_term,
        "automatic": True,
        "last_course_sync": latest_course_sync,
        "departments_ready": len(course_states),
        "walking_last_sync": walking.last_success_at if walking else None,
        "walking_pairs": walking.records_updated if walking else 0,
    }
