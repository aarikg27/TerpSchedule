import asyncio
from app.database import async_session_maker, init_db
from app.models import BuildingDistance

# NOTE: These are approximate seeded walking times, not live GPS data.
# Real walking distances vary by route, weather, and pace.

DISTANCES = [
    ("IRB", "AVW", 2),
    ("IRB", "CSI", 3),
    ("IRB", "MTH", 8),
    ("IRB", "ESJ", 7),
    ("IRB", "PLS", 12),
    ("IRB", "ARM", 10),
    ("IRB", "TYD", 9),
    ("IRB", "JMZ", 5),
    ("IRB", "KEL", 6),
    ("IRB", "SQH", 11),
    ("IRB", "HBK", 8),
    ("IRB", "SPH", 13),
    ("IRB", "CHM", 7),
    ("AVW", "MTH", 7),
    ("AVW", "CSI", 2),
    ("AVW", "ESJ", 6),
    ("MTH", "ESJ", 4),
    ("MTH", "TYD", 5),
    ("MTH", "HBK", 4),
    ("MTH", "KEL", 3),
    ("ESJ", "TYD", 3),
    ("ESJ", "ARM", 5),
    ("ESJ", "HBK", 3),
    ("TYD", "ARM", 4),
    ("TYD", "SQH", 6),
    ("TYD", "HBK", 3),
    ("KEL", "JMZ", 3),
    ("KEL", "CHM", 4),
    ("PLS", "SQH", 5),
    ("PLS", "CHM", 6),
    ("SQH", "SPH", 4),
    ("ARM", "HBK", 5),
]

BUILDINGS = {"IRB", "AVW", "MTH", "ESJ", "CSI", "PLS", "ARM", "TYD", "JMZ", "KEL", "SQH", "HBK", "SPH", "CHM"}


async def seed_buildings():
    print("NOTE: These are approximate seeded walking times, not live GPS data.")

    await init_db()

    async with async_session_maker() as session:
        count = 0

        for b in BUILDINGS:
            await session.merge(BuildingDistance(origin=b, destination=b, walk_minutes=0))
            count += 1

        for src, dst, minutes in DISTANCES:
            await session.merge(BuildingDistance(origin=src, destination=dst, walk_minutes=minutes))
            await session.merge(BuildingDistance(origin=dst, destination=src, walk_minutes=minutes))
            count += 2

        await session.commit()
        print(f"Inserted {count} building distance pairs.")


if __name__ == "__main__":
    asyncio.run(seed_buildings())
