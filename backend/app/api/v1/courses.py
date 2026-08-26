from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.course import Course
from app.models.section import Section
from app.models.meeting_time import MeetingTime
from app.models.professor import Professor
from app.schemas.course import CourseResponse, CourseSearchResult, SectionResponse, MeetingResponse, minutes_to_time_str
from app.services.ingest import ensure_courses_ingested
from app.config import settings
import re

router = APIRouter()

@router.get("", response_model=list[CourseSearchResult])
async def search_courses(
    search: str | None = None,
    term: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    selected_term = term or settings.DEFAULT_TERM
    stmt = select(Course).where(Course.term_id == selected_term)
    if search:
        search_term = f"%{search}%"
        stmt = stmt.where(Course.course_id.ilike(search_term) | Course.name.ilike(search_term))
    
    result = await db.execute(stmt)
    courses = result.scalars().all()
    # Let a student paste an exact course code even when that department has
    # never been cached on this deployment.
    normalized = (search or '').upper().replace(' ', '')
    if not courses and re.fullmatch(r"[A-Z]{4}\d{3}[A-Z]?", normalized):
        await ensure_courses_ingested(selected_term, [normalized])
        db.expire_all()
        result = await db.execute(stmt)
        courses = result.scalars().all()
    return courses

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: str,
    term: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Course)
        .where(Course.term_id == (term or settings.DEFAULT_TERM), Course.course_id == course_id)
        .options(
            selectinload(Course.sections).selectinload(Section.meetings),
            selectinload(Course.sections).selectinload(Section.professor_rel)
        )
    )
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    sections_response = []
    for sec in course.sections:
        meetings = []
        for m in sec.meetings:
            meetings.append(MeetingResponse(
                day=m.day,
                start_time=minutes_to_time_str(m.start_time) if m.start_time is not None else "",
                end_time=minutes_to_time_str(m.end_time) if m.end_time is not None else "",
                building=m.building,
                room=m.room,
                class_type=m.class_type
            ))
            
        instructor = sec.instructor
        avg_rating = sec.professor_rel.average_rating if sec.professor_rel else None
        avg_gpa = sec.average_gpa
        
        sections_response.append(SectionResponse(
            section_id=sec.section_id,
            course_id=sec.course_id,
            instructor=instructor,
            avg_rating=avg_rating,
            avg_gpa=avg_gpa,
            seats_total=sec.seats_total,
            open_seats=sec.open_seats,
            waitlist_count=sec.waitlist_count,
            meetings=meetings
        ))
        
    return CourseResponse(
        course_id=course.course_id,
        department=course.department,
        name=course.name,
        credits=course.credits,
        description=course.description,
        sections=sections_response
    )
