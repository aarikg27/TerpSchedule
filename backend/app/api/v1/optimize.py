from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import time

from app.database import get_db
from app.models.course import Course
from app.models.section import Section
from app.models.meeting_time import MeetingTime
from app.models.professor import Professor
from app.models.building_distance import BuildingDistance
from app.schemas.optimize import OptimizeRequest, OptimizeResponse, RankedSchedule, ScheduleMetrics, SectionResult, MeetingResult
from app.schemas.course import minutes_to_time_str
from app.services.optimizer import ScheduleOptimizer, SolverSection, SolverMeeting
from app.services.scoring import compute_total_score
from app.config import settings
from app.services.ingest import ensure_courses_ingested

router = APIRouter()

@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_schedule(
    request: OptimizeRequest,
    db: AsyncSession = Depends(get_db)
):
    start_time = time.perf_counter()

    # 1. Query DB for all sections of requested courses with their meetings
    stmt = (
        select(Course)
        .where(Course.course_id.in_(request.courses))
        .options(
            selectinload(Course.sections).selectinload(Section.meetings),
            selectinload(Course.sections).selectinload(Section.professor_rel)
        )
    )
    result = await db.execute(stmt)
    courses = result.scalars().all()

    # Repair partial/failed syncs on demand. A course row without sections is not
    # usable by the optimizer and should be treated as stale data.
    found_with_sections = {course.course_id for course in courses if course.sections}
    stale_or_missing = set(request.courses) - found_with_sections
    if stale_or_missing:
        await ensure_courses_ingested(request.term, sorted(stale_or_missing))
        # The ingest uses its own session, so expire this session before re-querying.
        db.expire_all()
        result = await db.execute(stmt)
        courses = result.scalars().all()
    
    if not courses:
        raise HTTPException(status_code=400, detail="No matching courses found")
        
    found_courses = {c.course_id for c in courses}
    missing_courses = set(request.courses) - found_courses
    if missing_courses:
        raise HTTPException(status_code=400, detail=f"Courses not found: {', '.join(missing_courses)}")
        
    # 3. Query building_distances table
    dist_stmt = select(BuildingDistance)
    dist_result = await db.execute(dist_stmt)
    distances = dist_result.scalars().all()
    building_distances = {(d.origin, d.destination): d.walk_minutes for d in distances}
    
    # 4. Convert DB to SolverSection/SolverMeeting
    course_sections: dict[str, list[SolverSection]] = {}
    for course in courses:
        sections_list = []
        for sec in course.sections:
            meetings = []
            for m in sec.meetings:
                meetings.append(SolverMeeting(
                    day=m.day,
                    start_min=m.start_time,
                    end_min=m.end_time,
                    building=m.building,
                    room=m.room
                ))
            
            avg_rating = sec.professor_rel.average_rating if sec.professor_rel else 3.0
            avg_gpa = getattr(sec.professor_rel, 'average_gpa', 3.0) if sec.professor_rel else 3.0
            
            sections_list.append(SolverSection(
                section_id=sec.section_id,
                course_id=sec.course_id,
                instructor=sec.instructor,
                avg_rating=avg_rating,
                avg_gpa=avg_gpa,
                meetings=meetings
            ))
        course_sections[course.course_id] = sections_list
        
    # 5. Create ScheduleOptimizer
    optimizer = ScheduleOptimizer(
        course_sections=course_sections,
        earliest_start=request.constraints.earliest_start_time,
        latest_end=request.constraints.latest_end_time,
        blocked_days=set(request.constraints.blocked_days),
        max_gap_minutes=request.constraints.max_gap_minutes,
        avoid_professors=set(request.constraints.avoid_professors),
        building_distances=building_distances,
        timeout_ms=settings.OPTIMIZER_TIMEOUT_MS,
        beam_threshold=settings.BEAM_SEARCH_THRESHOLD
    )
    
    # 6. Call solver.solve()
    valid_schedules = optimizer.solve()
    
    # 7 & 8. Score each valid schedule and take top 20
    scored_schedules = []
    weights_dict = request.scoring_weights()
    for schedule in valid_schedules:
        score, metrics_dict = compute_total_score(
            schedule=schedule,
            weights=weights_dict,
            target_campus_days=request.constraints.target_campus_days,
            building_distances=building_distances,
            default_walk=settings.DEFAULT_WALK_MINUTES
        )
        scored_schedules.append((score, metrics_dict, schedule))
        
    scored_schedules.sort(key=lambda x: x[0], reverse=True)
    top_schedules = scored_schedules[:20]
    
    # 9. Build OptimizeResponse
    ranked_schedules = []
    for rank, (score, metrics_dict, schedule) in enumerate(top_schedules, 1):
        sections_result = []
        for sec in schedule:
            meetings_result = []
            for m in sec.meetings:
                meetings_result.append(MeetingResult(
                    day=m.day,
                    start=minutes_to_time_str(m.start_min),
                    end=minutes_to_time_str(m.end_min),
                    building=m.building,
                    room=m.room
                ))
            sections_result.append(SectionResult(
                course_id=sec.course_id,
                section_id=sec.section_id,
                instructor=sec.instructor,
                rating=sec.avg_rating,
                gpa=sec.avg_gpa,
                meetings=meetings_result
            ))
            
        metrics = ScheduleMetrics(**metrics_dict)
        ranked_schedules.append(RankedSchedule(
            rank=rank,
            total_score=score,
            metrics=metrics,
            sections=sections_result
        ))
        
    end_time = time.perf_counter()
    execution_time_ms = (end_time - start_time) * 1000
    
    # 10. Return response
    return OptimizeResponse(
        total_combinations_checked=optimizer.combinations_checked,
        valid_schedules_count=len(valid_schedules),
        execution_time_ms=execution_time_ms,
        schedules=ranked_schedules
    )
