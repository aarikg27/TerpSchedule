FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir uv

COPY pyproject.toml .
RUN uv pip install --system --no-cache-dir \
    fastapi "uvicorn[standard]" "sqlalchemy[asyncio]" aiosqlite \
    httpx beautifulsoup4 icalendar pydantic-settings cachetools pytz

COPY app/ ./app/
COPY seed_buildings.py .

EXPOSE 8000

CMD ["sh", "-c", "python seed_buildings.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
