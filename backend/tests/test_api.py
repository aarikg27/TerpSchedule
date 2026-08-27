import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.database import async_session_maker, init_db
from app.models import Course, Section, MeetingTime, Professor, BuildingDistance
from sqlalchemy import select, delete


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "terpschedule"}


@pytest.mark.asyncio
async def test_optimize_rejects_oversized_or_duplicate_course_lists():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        oversized = await ac.post("/api/v1/optimize", json={"courses": [f"TEST{i:03d}" for i in range(9)]})
        duplicated = await ac.post("/api/v1/optimize", json={"courses": ["CMSC132", "CMSC132"]})
    assert oversized.status_code == 422
    assert duplicated.status_code == 422


@pytest.mark.asyncio
async def test_optimize_and_courses_flow(monkeypatch):
    async def skip_external_metrics(*args, **kwargs):
        return None
    monkeypatch.setattr("app.api.v1.optimize.ensure_course_metrics", skip_external_metrics)
    await init_db()

    # Seed or merge mock course & section data into DB for testing
    async with async_session_maker() as session:
        prof = await session.merge(
            Professor(name="Nelson Padua-Perez", slug="nelson", average_rating=4.5, total_reviews=100)
        )
        c1 = await session.merge(
            Course(course_id="CMSC132", department="CMSC", name="Object-Oriented Programming II", credits=4)
        )
        c2 = await session.merge(
            Course(course_id="MATH240", department="MATH", name="Linear Algebra", credits=4)
        )
        await session.flush()

        # Clean existing test sections if any
        stmt_sec = select(Section).where(Section.course_id.in_(["CMSC132", "MATH240"]))
        existing_secs = (await session.execute(stmt_sec)).scalars().all()
        for sec in existing_secs:
            await session.execute(delete(MeetingTime).where(MeetingTime.section_pk == sec.id))
            await session.delete(sec)
        await session.flush()

        s1 = Section(section_id="0101", course_id="CMSC132", instructor="Nelson Padua-Perez", seats_total=30, open_seats=5)
        session.add(s1)
        await session.flush()

        m1 = MeetingTime(section_pk=s1.id, day="M", start_time=540, end_time=590, building="IRB", room="0318")
        session.add(m1)

        s2 = Section(section_id="0201", course_id="MATH240", instructor="Nelson Padua-Perez", seats_total=30, open_seats=5)
        session.add(s2)
        await session.flush()

        m2 = MeetingTime(section_pk=s2.id, day="M", start_time=600, end_time=650, building="MTH", room="1407")
        session.add(m2)

        dist = await session.merge(BuildingDistance(origin="IRB", destination="MTH", walk_minutes=8))

        await session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Search courses
        search_res = await ac.get("/api/v1/courses?search=CMSC")
        assert search_res.status_code == 200
        courses = search_res.json()
        assert len(courses) >= 1
        assert any(c["course_id"] == "CMSC132" for c in courses)

        # Get course detail
        detail_res = await ac.get("/api/v1/courses/CMSC132")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["course_id"] == "CMSC132"
        assert len(detail["sections"]) >= 1

        walking_res = await ac.get("/api/v1/courses/walking-estimate?origin=IRB&destination=MTH")
        assert walking_res.status_code == 200
        assert walking_res.json()["walk_minutes"] == 8

        # Optimize endpoint
        optimize_payload = {
            "courses": ["CMSC132", "MATH240"],
            "constraints": {
                "earliest_start_time": 480,
                "latest_end_time": 1320,
                "blocked_days": [],
                "max_gap_minutes": 180,
                "avoid_professors": [],
                "target_campus_days": 5,
            },
            "weights": {
                "professor_quality": 0.4,
                "compactness": 0.3,
                "campus_days": 0.15,
                "transit_ease": 0.15,
            },
        }
        opt_res = await ac.post("/api/v1/optimize", json=optimize_payload)
        assert opt_res.status_code == 200
        opt_data = opt_res.json()
        assert opt_data["valid_schedules_count"] >= 1
        assert len(opt_data["schedules"]) >= 1
        top_sched = opt_data["schedules"][0]
        assert top_sched["rank"] == 1
        assert top_sched["total_score"] > 0
        assert len(top_sched["sections"]) == 2
        assert opt_data["registerable_schedules_count"] >= 1
        assert len(opt_data["open_schedules"]) >= 1

        # Export iCal endpoint
        export_res = await ac.get("/api/v1/export/ical?sections=CMSC132-0101,MATH240-0201")
        assert export_res.status_code == 200
        assert "BEGIN:VCALENDAR" in export_res.text
        assert "CMSC132 - 0101" in export_res.text
