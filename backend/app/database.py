from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import inspect, text
from app.config import settings

class Base(DeclarativeBase):
    pass

engine = create_async_engine(settings.DATABASE_URL)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Lightweight compatibility migration for existing local databases.
        def section_columns(sync_conn):
            return {column["name"] for column in inspect(sync_conn).get_columns("sections")}
        columns = await conn.run_sync(section_columns)
        if "average_gpa" not in columns:
            await conn.execute(text("ALTER TABLE sections ADD COLUMN average_gpa FLOAT NOT NULL DEFAULT 3.0"))
        if "gpa_is_estimated" not in columns:
            await conn.execute(text("ALTER TABLE sections ADD COLUMN gpa_is_estimated BOOLEAN NOT NULL DEFAULT 1"))
        def distance_columns(sync_conn):
            return {column["name"] for column in inspect(sync_conn).get_columns("building_distances")}
        distance_cols = await conn.run_sync(distance_columns)
        additions = {
            "distance_meters": "INTEGER",
            "source": "VARCHAR(40) DEFAULT 'legacy_seed'",
            "updated_at": "DATETIME",
        }
        for name, ddl in additions.items():
            if name not in distance_cols:
                await conn.execute(text(f"ALTER TABLE building_distances ADD COLUMN {name} {ddl}"))
