# TerpSchedule

TerpSchedule helps University of Maryland students compare every conflict-free version of a semester without manually matching dozens of Testudo sections.

Choose courses, set the boundaries that matter to you, and rank preferences such as instructor quality, compactness, campus days, and walking ease. TerpSchedule returns a visual calendar plus ranked alternatives and clearly distinguishes schedules that are open now from schedules containing full sections.

## What students can do

- Search and combine Fall 2026 UMD courses.
- Avoid instructors or require a particular instructor for a specific course.
- Keep days free, choose earliest/latest class times, and limit gaps.
- Drag schedule preferences into a clear first-through-fourth priority order.
- Compare all results, open-only schedules, or schedules containing full/waitlist sections.
- See lectures, discussions/recitations, labs, and online meetings separately.
- Open any calendar block for instructor, seat, room, next-class, walking, and Google Maps details.
- Use Light, Dark, or System appearance from the settings menu.
- Compare instructor ratings, historical GPA, idle time, campus days, and estimated walks.
- Copy section numbers or export a selected schedule as an `.ics` calendar.

Seat counts are planning information, not a registration guarantee. Always confirm final availability and waitlist eligibility in Testudo.

## Data freshness

Students do not need to press a sync button. The backend automatically:

- refreshes supported Testudo departments every six hours;
- refreshes UMD Campus GIS building coordinates every 30 days;
- keeps the previous cache when an upstream service is unavailable; and
- repairs missing course data when a student requests it.

The header shows whether cached data is ready and when it was last refreshed.

## Run locally

Requirements: Python 3.11+, Node.js 20+, and npm.

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
python -m uvicorn app.main:app --reload --port 8000
```

On macOS/Linux, activate with `source .venv/bin/activate`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Run with Docker

```bash
docker compose up --build
```

- App: `http://localhost:3000`
- API documentation: `http://localhost:8000/docs`

The Docker volume preserves the SQLite cache between restarts.

## Configuration

Backend settings can be supplied in `backend/.env` or as environment variables.

| Setting | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite+aiosqlite:///./terpschedule.db` | Persistent database connection |
| `DEFAULT_TERM` | `202608` | Supported Testudo term |
| `DATA_REFRESH_HOURS` | `6` | Course and seat refresh interval |
| `WALKING_REFRESH_DAYS` | `30` | Campus coordinate refresh interval |
| `METRICS_REFRESH_DAYS` | `14` | PlanetTerp rating/GPA refresh interval |
| `OPTIMIZER_TIMEOUT_MS` | `250` | Exact-search time budget |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |

For a public deployment, use a persistent database/volume and set `CORS_ORIGINS` to the real frontend URL.

## Tests

```bash
cd backend
python -m pytest -q

cd ../frontend
npm run build
```

## Data sources and limitations

See [DATA_SOURCES.md](DATA_SOURCES.md) for what is live, estimated, cached, or unavailable. See [PUBLISHING.md](PUBLISHING.md) before making a public deployment.

TerpSchedule is an independent student project and is not affiliated with or endorsed by the University of Maryland.

## License

MIT
