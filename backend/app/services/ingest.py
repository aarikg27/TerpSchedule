import asyncio
import logging
from typing import Any, Dict, List, Tuple

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import delete
from sqlalchemy.future import select

from app.config import settings
from app.database import async_session_maker
from app.models import Course, MeetingTime, Professor, Section, SyncState
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)


def parse_time_string(time_str: str) -> int:
    time_str = time_str.strip().lower()
    if not time_str:
        return 0

    is_pm = "pm" in time_str
    is_am = "am" in time_str
    time_str = time_str.replace("am", "").replace("pm", "").strip()

    parts = time_str.split(":")
    if len(parts) != 2:
        return 0

    try:
        hours = int(parts[0])
        minutes = int(parts[1])
    except ValueError:
        return 0

    if hours == 12:
        if is_am:
            hours = 0
    elif is_pm:
        hours += 12

    return hours * 60 + minutes


def parse_days(day_string: str) -> List[str]:
    days = []
    i = 0
    while i < len(day_string):
        if i + 1 < len(day_string) and day_string[i : i + 2] in ["Tu", "Th"]:
            days.append(day_string[i : i + 2])
            i += 2
        else:
            if day_string[i] in ["M", "W", "F"]:
                days.append(day_string[i])
            i += 1
    return days


async def scrape_testudo_department(term_id: str, department: str) -> List[Dict[str, Any]]:
    headers = {"User-Agent": settings.outbound_user_agent}
    courses_map: Dict[str, Dict[str, Any]] = {}

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        # 1. Fetch department course listing
        dept_url = f"{settings.TESTUDO_BASE_URL}/{term_id}/{department}"
        try:
            resp = await client.get(dept_url, headers=headers)
            resp.raise_for_status()
        except httpx.HTTPError as e:
            logger.error(f"Error fetching department {dept_url}: {e}")
            return []

        soup = BeautifulSoup(resp.text, "html.parser")
        for course_div in soup.select("div.course"):
            course_id_el = course_div.select_one("div.course-id")
            title_el = course_div.select_one("span.course-title")
            credits_el = course_div.select_one("span.course-min-credits")
            desc_el = course_div.select_one("div.approved-course-text")

            if not course_id_el or not title_el:
                continue

            course_id = course_id_el.get_text(strip=True)
            title = title_el.get_text(strip=True)
            credits_text = credits_el.get_text(strip=True) if credits_el else "0"
            description = desc_el.get_text(strip=True) if desc_el else ""

            try:
                credits_val = int(credits_text)
            except ValueError:
                credits_val = 3

            courses_map[course_id] = {
                "course_id": course_id,
                "department": department,
                "name": title,
                "credits": credits_val,
                "description": description,
                "sections": [],
            }

        # 2. Fetch sections in batches of 15 courses
        course_ids = list(courses_map.keys())
        batch_size = 15

        for i in range(0, len(course_ids), batch_size):
            batch = course_ids[i : i + batch_size]
            sec_url = f"{settings.TESTUDO_BASE_URL}/{term_id}/sections?courseIds={','.join(batch)}"

            try:
                sec_resp = await client.get(sec_url, headers=headers)
                sec_resp.raise_for_status()
                await asyncio.sleep(0.15)
            except httpx.HTTPError as e:
                logger.error(f"Error fetching sections {sec_url}: {e}")
                continue

            sec_soup = BeautifulSoup(sec_resp.text, "html.parser")

            for course_sec_div in sec_soup.select("div.course-sections"):
                c_id = course_sec_div.get("id")
                if not c_id or c_id not in courses_map:
                    continue

                for section_div in course_sec_div.select("div.sections-container div.section"):
                    section_id_el = section_div.select_one("span.section-id")
                    # Select the inner element. The outer .section-instructors wrapper can
                    # contain formatting whitespace and more than one instructor.
                    instructor_els = section_div.select("span.section-instructor")
                    total_seats_el = section_div.select_one("span.total-seats-count")
                    open_seats_el = section_div.select_one("span.open-seats-count")
                    waitlist_el = section_div.select_one("span.waitlist-count")

                    if not section_id_el:
                        continue

                    section_id = section_id_el.get_text(strip=True)

                    instructor = None
                    if instructor_els:
                        names = [el.get_text(" ", strip=True) for el in instructor_els]
                        names = [name for name in names if name and "TBA" not in name.upper()]
                        if names:
                            instructor = " / ".join(dict.fromkeys(names))

                    total_seats = int(total_seats_el.get_text(strip=True)) if total_seats_el else 0
                    open_seats = int(open_seats_el.get_text(strip=True)) if open_seats_el else 0
                    waitlist = int(waitlist_el.get_text(strip=True)) if waitlist_el else 0

                    section_info = {
                        "section_id": section_id,
                        "instructor": instructor,
                        "seats_total": total_seats,
                        "open_seats": open_seats,
                        "waitlist_count": waitlist,
                        "meeting_times": [],
                    }

                    # Meeting rows (Lectures and assigned Discussions/Labs)
                    # A class-days-container contains one row per lecture,
                    # discussion, or lab. Parsing the container itself silently kept only
                    # its first row and made many real schedules look conflict-free or
                    # impossible for the wrong reasons.
                    for row in section_div.select("div.class-days-container > div.row"):
                        days_el = row.select_one("span.section-days")
                        start_time_el = row.select_one("span.class-start-time")
                        end_time_el = row.select_one("span.class-end-time")
                        building_el = row.select_one("span.building-code")
                        room_el = row.select_one("span.class-room")
                        class_type_el = row.select_one("span.class-type")

                        if not days_el or not start_time_el or not end_time_el:
                            # Check if online or TBA
                            if days_el and "ONLINE" in days_el.get_text(strip=True):
                                section_info["meeting_times"].append({
                                    "day": "ONLINE",
                                    "start_time": 0,
                                    "end_time": 0,
                                    "building": "ONLINE",
                                    "room": "ONLINE",
                                    "class_type": "Online",
                                })
                            continue

                        days_text = days_el.get_text(strip=True)
                        start_text = start_time_el.get_text(strip=True)
                        end_text = end_time_el.get_text(strip=True)
                        building = building_el.get_text(strip=True) if building_el else ""
                        room = room_el.get_text(strip=True) if room_el else ""
                        class_type = class_type_el.get_text(strip=True) if class_type_el else "Lecture"

                        parsed_days = parse_days(days_text)
                        start_time = parse_time_string(start_text)
                        end_time = parse_time_string(end_text)

                        for day in parsed_days:
                            section_info["meeting_times"].append({
                                "day": day,
                                "start_time": start_time,
                                "end_time": end_time,
                                "building": building,
                                "room": room,
                                "class_type": class_type,
                            })

                    courses_map[c_id]["sections"].append(section_info)

    return list(courses_map.values())


async def ensure_courses_ingested(term_id: str, course_ids: List[str]) -> Dict[str, int]:
    """Refresh only the departments needed by an optimization request."""
    departments = sorted({course_id[:4].upper() for course_id in course_ids if len(course_id) >= 4})
    return await run_full_ingest(term_id, departments, include_ratings=False)


async def fetch_professor_rating(name: str) -> Tuple[float, int]:
    if not name:
        return 0.0, 0
    url = f"{settings.PLANETTERP_BASE_URL}/professor"
    params = {"name": name}

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                return float(data.get("average_rating", 0.0)), int(data.get("total_reviews", 0))
            return 0.0, 0
        except Exception:
            return 0.0, 0


async def fetch_course_gpa(course_id: str, professor_name: str) -> float:
    if not professor_name:
        return 3.0
    url = f"{settings.PLANETTERP_BASE_URL}/grades"
    params = {"course": course_id, "professor": professor_name}

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url, params=params)
            if response.status_code != 200:
                return 3.0

            data = response.json()
            total_points = 0.0
            total_students = 0

            grade_weights = {
                "A+": 4.0, "A": 4.0, "A-": 3.7,
                "B+": 3.3, "B": 3.0, "B-": 2.7,
                "C+": 2.3, "C": 2.0, "C-": 1.7,
                "D+": 1.3, "D": 1.0, "D-": 0.7,
                "F": 0.0,
            }

            for entry in data:
                for grade, weight in grade_weights.items():
                    count = entry.get(grade, 0)
                    total_points += count * weight
                    total_students += count

            if total_students == 0:
                return 3.0

            return round(total_points / total_students, 2)
        except Exception:
            return 3.0


async def fetch_course_gpas(course_id: str) -> Dict[str, float]:
    """Fetch one course once and aggregate GPA by instructor."""
    url = f"{settings.PLANETTERP_BASE_URL}/grades"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url, params={"course": course_id})
            if response.status_code != 200:
                return {}
            rows = response.json()
        except Exception:
            return {}

    weights = {
        "A+": 4.0, "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
        "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "D-": 0.7, "F": 0.0,
    }
    totals: Dict[str, list[float]] = {}
    for row in rows:
        professor = row.get("professor")
        if not professor:
            continue
        points = sum(float(row.get(grade, 0) or 0) * weight for grade, weight in weights.items())
        students = sum(int(row.get(grade, 0) or 0) for grade in weights)
        bucket = totals.setdefault(professor, [0.0, 0.0])
        bucket[0] += points
        bucket[1] += students
    return {name: round(points / students, 2) for name, (points, students) in totals.items() if students}


async def ensure_course_metrics(term_id: str, course_ids: List[str]) -> None:
    """Populate real GPA/rating data once per course without re-scraping Testudo."""
    async with async_session_maker() as session:
        stale: list[str] = []
        for course_id in course_ids:
            state = await session.get(SyncState, f"metrics:{term_id}:{course_id}")
            cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=settings.METRICS_REFRESH_DAYS)
            if not state or state.last_success_at < cutoff:
                stale.append(course_id)
    if not stale:
        return

    gpa_maps = await asyncio.gather(*(fetch_course_gpas(course_id) for course_id in stale))
    async with async_session_maker() as session:
        for course_id, gpas in zip(stale, gpa_maps):
            sections = (await session.execute(select(Section).where(Section.term_id == term_id, Section.course_id == course_id))).scalars().all()
            instructor_names = sorted({section.instructor for section in sections if section.instructor})
            ratings = await asyncio.gather(*(fetch_professor_rating(name) for name in instructor_names))
            for name, (rating, reviews) in zip(instructor_names, ratings):
                existing = await session.get(Professor, name)
                await session.merge(Professor(
                    name=name,
                    slug=existing.slug if existing else _generate_slug(name),
                    average_rating=rating,
                    total_reviews=reviews,
                ))
            for section in sections:
                section.average_gpa = gpas.get(section.instructor or "", 3.0)
                section.gpa_is_estimated = (section.instructor or "") not in gpas
            await session.merge(SyncState(
                key=f"metrics:{term_id}:{course_id}",
                last_success_at=datetime.now(timezone.utc).replace(tzinfo=None),
                records_updated=len(sections),
                status="ready",
            ))
        await session.commit()


def _generate_slug(name: str) -> str:
    return name.lower().replace(" ", "_")


async def run_full_ingest(term_id: str, departments: List[str], include_ratings: bool = True) -> Dict[str, int]:
    summary = {"courses": 0, "sections": 0, "professors": 0}
    professors_cache = set()
    gpa_cache: Dict[tuple[str, str], float] = {}

    async with async_session_maker() as session:
        for dept in departments:
            courses = await scrape_testudo_department(term_id, dept)

            for course_data in courses:
                if not include_ratings:
                    await session.execute(delete(SyncState).where(
                        SyncState.key == f"metrics:{term_id}:{course_data['course_id']}"
                    ))
                course = Course(
                    term_id=term_id,
                    course_id=course_data["course_id"],
                    department=course_data["department"],
                    name=course_data["name"],
                    credits=course_data["credits"],
                    description=course_data["description"],
                )
                await session.merge(course)
                summary["courses"] += 1

                for section_data in course_data["sections"]:
                    instructor_name = section_data["instructor"]
                    average_gpa = 3.0

                    if instructor_name and instructor_name not in professors_cache:
                        existing_professor = await session.get(Professor, instructor_name)
                        if include_ratings or not existing_professor:
                            rating, reviews = await fetch_professor_rating(instructor_name) if include_ratings else (0.0, 0)
                            professor = Professor(
                                name=instructor_name,
                                slug=_generate_slug(instructor_name),
                                average_rating=rating,
                                total_reviews=reviews,
                            )
                            await session.merge(professor)
                        professors_cache.add(instructor_name)
                        summary["professors"] += 1

                    if instructor_name:
                        gpa_key = (course_data["course_id"], instructor_name)
                        if include_ratings and gpa_key not in gpa_cache:
                            gpa_cache[gpa_key] = await fetch_course_gpa(*gpa_key)
                        average_gpa = gpa_cache.get(gpa_key, 3.0)

                    stmt = select(Section).where(
                        Section.term_id == term_id,
                        Section.course_id == course_data["course_id"],
                        Section.section_id == section_data["section_id"],
                    )
                    existing_sec = (await session.execute(stmt)).scalar_one_or_none()
                    if existing_sec and not include_ratings:
                        average_gpa = existing_sec.average_gpa

                    section_obj = Section(
                        term_id=term_id,
                        section_id=section_data["section_id"],
                        course_id=course_data["course_id"],
                        instructor=instructor_name,
                        seats_total=section_data["seats_total"],
                        open_seats=section_data["open_seats"],
                        waitlist_count=section_data["waitlist_count"],
                        average_gpa=average_gpa,
                        gpa_is_estimated=existing_sec.gpa_is_estimated if existing_sec and not include_ratings else instructor_name not in gpa_cache,
                    )

                    if existing_sec:
                        section_obj.id = existing_sec.id

                    section = await session.merge(section_obj)
                    await session.flush()
                    summary["sections"] += 1

                    del_stmt = delete(MeetingTime).where(MeetingTime.section_pk == section.id)
                    await session.execute(del_stmt)

                    for mt_data in section_data["meeting_times"]:
                        mt = MeetingTime(
                            section_pk=section.id,
                            day=mt_data["day"],
                            start_time=mt_data["start_time"],
                            end_time=mt_data["end_time"],
                            building=mt_data["building"],
                            room=mt_data["room"],
                            class_type=mt_data["class_type"],
                        )
                        session.add(mt)

            if courses:
                await session.merge(SyncState(
                    key=f"soc:{term_id}:{dept}",
                    last_success_at=datetime.now(timezone.utc).replace(tzinfo=None),
                    records_updated=sum(len(course_data["sections"]) for course_data in courses),
                    status="ready",
                ))

        await session.commit()

    return summary
