import math
import re
from datetime import datetime, timezone

import httpx

from app.config import settings
from app.database import async_session_maker
from app.models import Building, BuildingDistance, SyncState


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _haversine_meters(a: Building, b: Building) -> float:
    radius = 6_371_000
    lat1, lat2 = math.radians(a.latitude), math.radians(b.latitude)
    dlat = lat2 - lat1
    dlon = math.radians(b.longitude - a.longitude)
    value = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(value))


def estimate_walk(distance_meters: float) -> tuple[int, int]:
    """Convert straight-line distance to a conservative campus walking estimate."""
    routed_meters = round(distance_meters * 1.28)
    minutes = max(1, math.ceil(routed_meters / 78))
    return routed_meters, minutes


async def refresh_walking_cache() -> dict[str, int]:
    """Refresh UMD building coordinates and all pairwise cached walk estimates."""
    params = {
        "where": "BLDG_CODE IS NOT NULL",
        "outFields": "BUILDINGID,NAME,BLDG_CODE",
        "returnGeometry": "false",
        "returnCentroid": "true",
        "outSR": "4326",
        "f": "json",
    }
    headers = {"User-Agent": "TerpSchedule/1.0 (UMD student schedule planner)"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(settings.UMD_BUILDINGS_URL, params=params, headers=headers)
        response.raise_for_status()
        payload = response.json()

    now = _utcnow()
    by_code: dict[str, Building] = {}
    for feature in payload.get("features", []):
        attrs = feature.get("attributes", {})
        centroid = feature.get("centroid") or {}
        if centroid.get("x") is None or centroid.get("y") is None:
            continue
        # A few facilities publish aliases such as MTH/MATH. Cache each code.
        codes = re.findall(r"[A-Z0-9]{2,10}", (attrs.get("BLDG_CODE") or "").upper())
        for code in codes:
            by_code[code] = Building(
                code=code,
                building_id=attrs.get("BUILDINGID"),
                name=attrs.get("NAME") or code,
                latitude=float(centroid["y"]),
                longitude=float(centroid["x"]),
                source="umd_campus_gis",
                updated_at=now,
            )

    async with async_session_maker() as session:
        buildings: list[Building] = []
        for building in by_code.values():
            buildings.append(await session.merge(building))
        await session.flush()

        pair_count = 0
        for origin in buildings:
            for destination in buildings:
                if origin.code == destination.code:
                    meters, minutes = 0, 0
                else:
                    meters, minutes = estimate_walk(_haversine_meters(origin, destination))
                await session.merge(BuildingDistance(
                    origin=origin.code,
                    destination=destination.code,
                    walk_minutes=minutes,
                    distance_meters=meters,
                    source="umd_gis_estimate",
                    updated_at=now,
                ))
                pair_count += 1

        await session.merge(SyncState(
            key="walking:umd-campus-gis",
            last_success_at=now,
            records_updated=pair_count,
            status="ready",
        ))
        await session.commit()

    return {"buildings": len(by_code), "distance_pairs": pair_count}
