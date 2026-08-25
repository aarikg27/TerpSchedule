from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.section import Section
from app.utils.ical import generate_ical
from app.schemas.course import minutes_to_time_str

router = APIRouter()

@router.get("/ical")
async def export_ical(
    sections: str,
    db: AsyncSession = Depends(get_db)
):
    section_queries = [s.strip() for s in sections.split(",") if s.strip()]
    if not section_queries:
        raise HTTPException(status_code=400, detail="No sections provided")
        
    # parse section PKs or course_id-section_id
    course_section_pairs = []
    pks = []
    for q in section_queries:
        if "-" in q:
            c_id, s_id = q.split("-", 1)
            course_section_pairs.append((c_id, s_id))
        elif q.isdigit():
            pks.append(int(q))
        else:
            raise HTTPException(status_code=400, detail=f"Invalid section format: {q}")
            
    stmt = select(Section).options(selectinload(Section.meetings))
    conditions = []
    
    if pks:
        conditions.append(Section.id.in_(pks))
    
    for c_id, s_id in course_section_pairs:
        conditions.append((Section.course_id == c_id) & (Section.section_id == s_id))
        
    if conditions:
        stmt = stmt.where(or_(*conditions))
    else:
        raise HTTPException(status_code=400, detail="No valid sections provided")
        
    result = await db.execute(stmt)
    db_sections = result.scalars().all()
    
    sections_data = []
    for sec in db_sections:
        meetings_data = []
        for m in sec.meetings:
            if m.start_time is None or m.end_time is None:
                continue
            meetings_data.append({
                "day": m.day,
                "start": minutes_to_time_str(m.start_time),
                "end": minutes_to_time_str(m.end_time),
                "building": m.building or "",
                "room": m.room or ""
            })
        sections_data.append({
            "course_id": sec.course_id,
            "section_id": sec.section_id,
            "instructor": sec.instructor or "TBA",
            "meetings": meetings_data
        })
        
    ical_bytes = generate_ical(sections_data)
    
    return Response(
        content=ical_bytes,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=schedule.ics"}
    )
