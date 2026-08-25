from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ingest import run_full_ingest

router = APIRouter()

class IngestRequest(BaseModel):
    term: str
    departments: list[str]

@router.post("/ingest")
async def ingest_data(request: IngestRequest):
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
