# Publishing checklist

TerpSchedule is feature-complete enough for a small public beta. Before calling it production-ready, complete the items below.

## Required before a public beta

- [ ] Choose a host for the FastAPI backend and a static host for the frontend.
- [ ] Attach persistent storage. An ephemeral SQLite file will lose synchronized data on every deployment.
- [ ] Set the production `DATABASE_URL` and `CORS_ORIGINS`.
- [ ] Add the production API origin to the frontend build or reverse-proxy `/api` to FastAPI.
- [ ] Add basic request/error logging and an uptime check for `/` and `/api/v1/sync-status`.
- [ ] Add a privacy page explaining that the app does not require accounts and does not need student schedules to be retained.
- [ ] Add Terms/Disclaimer language stating that Testudo controls official seats, registration, and waitlists.
- [ ] Confirm Testudo and PlanetTerp usage expectations and identify the app with a responsible User-Agent/contact.
- [ ] Run a complete Fall 2026 sync on the production database before sharing the link.
- [ ] Test the deployed app on iPhone Safari, Android Chrome, and a narrow laptop viewport.

## Strongly recommended after beta feedback

- [ ] Add a real migration tool such as Alembic before the next schema change.
- [ ] Move from SQLite to PostgreSQL if multiple backend workers will write concurrently.
- [ ] Add rate limiting to optimization and manual administrative refresh endpoints.
- [ ] Add structured monitoring for failed Testudo, PlanetTerp, and UMD GIS refreshes.
- [ ] Add a protected admin-only refresh endpoint and remove or protect the current public ingest endpoint.
- [ ] Add automated end-to-end tests for course search, generation, availability filters, and calendar export.
- [ ] Add term-aware database keys before supporting more than one semester in the UI.
- [ ] Add accessibility testing for keyboard navigation, contrast, focus order, and screen readers.
- [ ] Decide whether analytics are genuinely needed. If added, use a privacy-respecting option and disclose it.

## Known product limitations

- Only Fall 2026 is intentionally exposed. The current schema must become term-aware before a semester picker is safe.
- Walking durations are cached estimates based on official UMD building coordinates, not turn-by-turn pedestrian routes.
- A section with zero open seats may be waitlistable or completely closed; Testudo must make the final determination.
- Instructor rating and GPA coverage varies. Neutral fallbacks are used when PlanetTerp has no data.
- Each results tab receives its own highest-scoring 100 schedules, while counts reflect the full valid result set.
