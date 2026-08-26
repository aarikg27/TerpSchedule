from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import inspect, text
from sqlalchemy.engine import make_url
from app.config import settings

class Base(DeclarativeBase):
    pass

database_url = make_url(settings.DATABASE_URL)
if database_url.drivername in {"postgres", "postgresql"}:
    # Neon publishes libpq connection parameters. asyncpg uses `ssl` and does
    # not accept libpq's `channel_binding` keyword.
    ssl_value = database_url.query.get("sslmode") or "require"
    database_url = (
        database_url.set(drivername="postgresql+asyncpg")
        .difference_update_query(["sslmode", "channel_binding"])
        .update_query_dict({"ssl": ssl_value})
    )
engine = create_async_engine(database_url, pool_pre_ping=True)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

async def init_db() -> None:
    async with engine.begin() as conn:
        # Upgrade the original single-term SQLite schema in place. IDs are
        # preserved so meeting rows remain attached to the same sections.
        if database_url.drivername.startswith("sqlite"):
            def schema_state(sync_conn):
                inspector = inspect(sync_conn)
                if "courses" not in inspector.get_table_names():
                    return False
                columns = {column["name"] for column in inspector.get_columns("courses")}
                pk = set(inspector.get_pk_constraint("courses").get("constrained_columns") or [])
                return "term_id" not in columns or pk != {"term_id", "course_id"}
            needs_term_upgrade = await conn.run_sync(schema_state)
            if needs_term_upgrade:
                await conn.execute(text("PRAGMA foreign_keys=OFF"))
                await conn.execute(text("ALTER TABLE meeting_times RENAME TO meeting_times_single_term"))
                await conn.execute(text("ALTER TABLE sections RENAME TO sections_single_term"))
                await conn.execute(text("ALTER TABLE courses RENAME TO courses_single_term"))
                await conn.run_sync(Base.metadata.create_all)
                await conn.execute(text("""
                    INSERT INTO courses (term_id, course_id, department, name, credits, description)
                    SELECT :term, course_id, department, name, credits, description FROM courses_single_term
                """), {"term": settings.DEFAULT_TERM})
                old_section_columns = await conn.run_sync(lambda sync_conn: {c["name"] for c in inspect(sync_conn).get_columns("sections_single_term")})
                gpa_expr = "average_gpa" if "average_gpa" in old_section_columns else "3.0"
                estimated_expr = "gpa_is_estimated" if "gpa_is_estimated" in old_section_columns else "1"
                await conn.execute(text(f"""
                    INSERT INTO sections (id, term_id, section_id, course_id, instructor, seats_total, open_seats, waitlist_count, average_gpa, gpa_is_estimated)
                    SELECT id, :term, section_id, course_id, instructor, seats_total, open_seats, waitlist_count, {gpa_expr}, {estimated_expr}
                    FROM sections_single_term
                """), {"term": settings.DEFAULT_TERM})
                await conn.execute(text("""
                    INSERT INTO meeting_times (id, section_pk, day, start_time, end_time, building, room, class_type)
                    SELECT id, section_pk, day, start_time, end_time, building, room, class_type FROM meeting_times_single_term
                """))
                await conn.execute(text("DROP TABLE meeting_times_single_term"))
                await conn.execute(text("DROP TABLE sections_single_term"))
                await conn.execute(text("DROP TABLE courses_single_term"))
                await conn.execute(text("PRAGMA foreign_keys=ON"))
        await conn.run_sync(Base.metadata.create_all)
        if database_url.drivername.startswith("postgresql"):
            # Data API access is deny-by-default. Its authenticated role can
            # only reach rows owned by the JWT user exposed by auth.user_id().
            await conn.execute(text("""
                DO $$ BEGIN
                  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                    GRANT USAGE ON SCHEMA public TO authenticated;
                    GRANT SELECT, INSERT, UPDATE, DELETE ON user_saved_schedules, user_planner_states, user_audit_summaries TO authenticated;
                  END IF;
                END $$
            """))
            for statement in (
                "ALTER TABLE user_saved_schedules ENABLE ROW LEVEL SECURITY",
                "ALTER TABLE user_planner_states ENABLE ROW LEVEL SECURITY",
                "ALTER TABLE user_audit_summaries ENABLE ROW LEVEL SECURITY",
                "DROP POLICY IF EXISTS user_saved_schedules_owner ON user_saved_schedules",
                """CREATE POLICY user_saved_schedules_owner ON user_saved_schedules
                    FOR ALL USING (auth.user_id()::text = user_id)
                    WITH CHECK (auth.user_id()::text = user_id)""",
                "DROP POLICY IF EXISTS user_planner_states_owner ON user_planner_states",
                """CREATE POLICY user_planner_states_owner ON user_planner_states
                    FOR ALL USING (auth.user_id()::text = user_id)
                    WITH CHECK (auth.user_id()::text = user_id)""",
                "DROP POLICY IF EXISTS user_audit_summaries_owner ON user_audit_summaries",
                """CREATE POLICY user_audit_summaries_owner ON user_audit_summaries
                    FOR ALL USING (auth.user_id()::text = user_id)
                    WITH CHECK (auth.user_id()::text = user_id)""",
            ):
                await conn.execute(text(statement))
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
