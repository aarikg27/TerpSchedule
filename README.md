# TerpSchedule

> **Automated Course Schedule Generator & Multi-Objective Optimization Engine for UMD Students**

TerpSchedule eliminates the tedious manual cross-referencing between Testudo, PlanetTerp, and campus maps. Students select target courses and configure time boundaries, blocked days, and preference weights. TerpSchedule computes all non-conflicting section combinations, scores them using a customizable multi-objective heuristic, and ranks the results on an interactive weekly dashboard with one-click iCal calendar export and CRN direct registration.

---

## Key Features

- **High-Performance Bitmask Solver**: $O(1)$ interval clash detection using 5-minute bitmask arithmetic across academic weekdays (Mon–Fri, 8:00 AM – 10:00 PM). Backtracking CSP with automatic Beam Search fallback for large combinatorial spaces.
- **Multi-Objective Pareto-Style Scoring**:
  - **Professor Quality**: Weighted average of PlanetTerp ratings (60%) and historical course GPAs (40%).
  - **Compactness**: Minimizes dead time between classes during the active day.
  - **Active Campus Days**: Balances schedule across preferred total active days per week.
  - **Transit & Walking Effort**: Evaluates walking times between consecutive classes using campus building distance tables.
- **Asynchronous & Online Course Support**: Safely integrates web-based and arranged asynchronous classes without false collision pruning.
- **Interactive 3-Column Visualizer**:
  - **Inputs & Sliders**: Course search with autocomplete, hard boundary filters, blocked day toggles, and live weight sliders.
  - **Weekly Timetable Grid**: Color-coded class blocks with rich hover previews (instructor rating, room, time, walk buffer).
  - **Metrics & Ranking**: Optimization radar chart (`recharts`), top alternative schedule cards, and 1-click Testudo CRN copy.
- **iCal / `.ics` Export**: RFC 5545 compliant recurring weekly calendar export ready for Apple Calendar, Google Calendar, and Outlook.
- **Data Ingestion**: Integrates PlanetTerp API with resilient Testudo SOC HTML parser.

---

## Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 (Async), `aiosqlite` (SQLite v1 / Postgres ready), `httpx`, `beautifulsoup4`, `icalendar`, `pydantic v2`
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, `recharts`, `lucide-react`
- **Testing**: `pytest`, `pytest-asyncio`, `httpx` ASGI test client

---

## Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment with uv or python venv
uv venv .venv --python 3.12
# Activate virtualenv:
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate

# Install dependencies
uv pip install fastapi "uvicorn[standard]" "sqlalchemy[asyncio]" aiosqlite httpx beautifulsoup4 icalendar pydantic-settings cachetools pytz pytest pytest-asyncio

# Seed initial campus building walking distances
python seed_buildings.py

# Run FastAPI backend
python -m uvicorn app.main:app --reload --port 8000
```

Backend API will be live at `http://localhost:8000`. Interactive Swagger docs are available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```

Frontend dashboard will be running at `http://localhost:5173`.

---

## Running the Automated Test Suite

Run the full pytest suite covering bitmask interval math, CSP solver constraints, multi-objective scoring, and API integration flows:

```bash
cd backend
python -m pytest tests/ -v
```

---

## Docker Deployment

To launch the complete stack with a single command:

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## API Specification Overview

### `POST /api/v1/optimize`
Computes and scores optimal non-conflicting schedules.

**Request:**
```json
{
  "courses": ["CMSC132", "MATH240"],
  "constraints": {
    "earliest_start_time": 480,
    "latest_end_time": 1200,
    "blocked_days": ["F"],
    "max_gap_minutes": 120,
    "avoid_professors": [],
    "target_campus_days": 4
  },
  "weights": {
    "professor_quality": 0.40,
    "compactness": 0.30,
    "campus_days": 0.15,
    "transit_ease": 0.15
  }
}
```

### `GET /api/v1/export/ical`
Returns `.ics` calendar payload for selected section identifiers (e.g. `?sections=CMSC132-0101,MATH240-0201`).

### `POST /api/v1/ingest`
Triggers Testudo scraping and PlanetTerp synchronization for specified departments and term.

---

## License

MIT License. Designed for University of Maryland students.
