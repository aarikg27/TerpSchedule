from fastapi import APIRouter
from app.api.v1 import courses, optimize, export, ingest, terms

v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(courses.router, prefix="/courses", tags=["courses"])
v1_router.include_router(optimize.router, prefix="", tags=["optimize"])
v1_router.include_router(export.router, prefix="/export", tags=["export"])
v1_router.include_router(ingest.router, prefix="", tags=["ingest"])
v1_router.include_router(terms.router, prefix="", tags=["terms"])
