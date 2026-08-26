from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.degree_audit import parse_degree_audit

router = APIRouter()


@router.post("/degree-audit/parse")
async def parse_audit(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=415, detail="Upload the printer-friendly audit as a PDF.")
    payload = await file.read()
    if len(payload) > 8_000_000:
        raise HTTPException(status_code=413, detail="Audit PDF must be smaller than 8 MB.")
    try:
        return parse_degree_audit(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
