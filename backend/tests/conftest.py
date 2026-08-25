import os
import sys
import pytest
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

# Ensure app package can be imported
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import Base
from app.models import Course, Professor, Section, MeetingTime, BuildingDistance
from app.services.optimizer import SolverSection, SolverMeeting

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    async with session_maker() as session:
        yield session
    await engine.dispose()

@pytest.fixture
def sample_sections():
    return {
        "CSCI101": [
            SolverSection(
                section_id="S1",
                course_id="CSCI101",
                instructor="Dr. Smith",
                avg_rating=4.5,
                avg_gpa=3.8,
                meetings=[
                    SolverMeeting("M", 540, 590, "CSB", "101"),
                    SolverMeeting("W", 540, 590, "CSB", "101")
                ],
                day_masks={}
            ),
            SolverSection(
                section_id="S2",
                course_id="CSCI101",
                instructor="Dr. Jones",
                avg_rating=3.5,
                avg_gpa=3.2,
                meetings=[
                    SolverMeeting("T", 600, 650, "CSB", "102"),
                    SolverMeeting("Th", 600, 650, "CSB", "102")
                ],
                day_masks={}
            )
        ],
        "MATH101": [
            SolverSection(
                section_id="S3",
                course_id="MATH101",
                instructor="Dr. Brown",
                avg_rating=4.0,
                avg_gpa=3.5,
                meetings=[
                    SolverMeeting("M", 590, 640, "MATHB", "201"),
                    SolverMeeting("W", 590, 640, "MATHB", "201")
                ],
                day_masks={}
            )
        ]
    }

@pytest.fixture
def sample_distances():
    return {
        ("CSB", "MATHB"): 10,
        ("MATHB", "CSB"): 10
    }
