# Data sources and transparency

TerpSchedule combines public data from several sources. This page explains what students should trust, what is estimated, and what the app cannot know.

## Testudo Schedule of Classes

Used for course names, sections, instructors, meeting days/times, rooms, meeting types, seat totals, open seats, and displayed waitlist counts.

The backend refreshes supported departments every six hours and keeps its previous cache during outages. Seat counts can change after a refresh and never guarantee successful registration.

Source: [UMD Schedule of Classes](https://app.testudo.umd.edu/soc/)

## PlanetTerp

Used for instructor ratings and course-specific historical GPA. Coverage is incomplete, especially for new instructors. Missing values use neutral defaults rather than being treated as poor performance.

Source: [PlanetTerp](https://planetterp.com/)

## UMD Campus GIS and walking estimates

Building codes and coordinates come from the official [UMD Campus Web Map](https://maps.umd.edu/), which is maintained using the university's Campus GIS services.

TerpSchedule converts the straight-line distance between official building centroids into a conservative pedestrian estimate:

- distance is multiplied by `1.28` to account for paths and entrances;
- walking speed is estimated at 78 meters per minute; and
- results are rounded up and cached for every known building pair.

Coordinates refresh every 30 days. These are planning estimates, not accessible-route guarantees or live navigation. The app uses a 10-minute fallback when Testudo reports an unknown building code.

The cache structure supports replacing estimates with exact pedestrian routes later without changing schedule generation.

## Availability language

- **Open now**: every selected section currently reports at least one open seat.
- **Waitlist/closed**: at least one selected section reports zero open seats.

The public data cannot always determine whether a waitlist is accepting additional students. Confirm the final status in Testudo.

## Semester support

The public interface intentionally supports Fall 2026 only. Although older Testudo pages may remain accessible, the current database keys are not term-aware. Exposing multiple terms before that migration could mix sections from different semesters.

## Independence

TerpSchedule is an independent student project. It is not affiliated with or endorsed by the University of Maryland, Testudo, or PlanetTerp.
