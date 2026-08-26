from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api.router import v1_router
from app.services.auto_sync import auto_sync_loop
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    sync_task = asyncio.create_task(auto_sync_loop())
    yield
    sync_task.cancel()

app = FastAPI(title="TerpSchedule", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "terpschedule"}
