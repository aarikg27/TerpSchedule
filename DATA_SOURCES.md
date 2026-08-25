# TerpSchedule data transparency

## Live data

- Course, section, meeting type, instructor, room, and seat counts come from the public Testudo Schedule of Classes pages when **Sync SOC** runs.
- Instructor ratings and course-specific historical GPA come from PlanetTerp. Missing values fall back to neutral defaults (3.0/5 rating and 3.0/4 GPA) so unrated instructors are not unfairly ranked last.

## Approximate data

- Walking times in `backend/seed_buildings.py` are a small approximate lookup table.
- A building pair absent from that table currently uses `DEFAULT_WALK_MINUTES` (10 minutes).
- “Needs waitlist” means Testudo reports zero open seats. It can also mean the section is closed; students must confirm whether its waitlist is accepting names in Testudo.

## Free walking-time upgrade

A no-paid-API implementation can use OpenStreetMap data:

1. Build a one-time table mapping UMD building codes to latitude/longitude. Resolve and manually verify each building once; do not geocode on every schedule request.
2. Cache those coordinates in the database and include attribution for OpenStreetMap contributors.
3. For a small deployment, request pedestrian routes from a responsibly used public routing service and permanently cache every building pair. Respect that service's published rate and usage limits.
4. For a durable deployment, self-host an open-source pedestrian router such as Valhalla, GraphHopper, or OSRM using the Maryland OpenStreetMap extract. This has no per-request fee, but it does use your server's CPU, RAM, and storage.
5. Store the route duration and distance with a `source` and `updated_at` field. Show “estimated” in the UI and keep a straight-line walking fallback for missing routes.

The best low-cost first version is a one-time script that computes and caches the few hundred building pairs students actually encounter. Schedule generation should only read cached values; it should never depend on a routing service being online.
