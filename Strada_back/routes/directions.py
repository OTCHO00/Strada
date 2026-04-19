import os
import httpx
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass

router = APIRouter()

GOOGLE_KEY = os.getenv("GOOGLE_PLACES_KEY", "")

class Waypoint(BaseModel):
    lat: float
    lng: float

class DirectionsRequest(BaseModel):
    mode: str          # "cycling" | "walking"
    waypoints: list[Waypoint]

@router.post("/directions")
async def get_directions(payload: DirectionsRequest):
    if not GOOGLE_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_PLACES_KEY non configurée")
    if len(payload.waypoints) < 2:
        raise HTTPException(status_code=400, detail="Au moins 2 waypoints requis")

    origin      = f"{payload.waypoints[0].lat},{payload.waypoints[0].lng}"
    destination = f"{payload.waypoints[-1].lat},{payload.waypoints[-1].lng}"
    stops       = "|".join(f"{w.lat},{w.lng}" for w in payload.waypoints[1:-1])
    google_mode = "bicycling" if payload.mode == "cycling" else "walking"

    params = {
        "origin":      origin,
        "destination": destination,
        "mode":        google_mode,
        "key":         GOOGLE_KEY,
    }
    if stops:
        params["waypoints"] = stops

    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://maps.googleapis.com/maps/api/directions/json",
            params=params,
            timeout=10,
        )

    if not res.is_success:
        raise HTTPException(status_code=502, detail="Erreur Google Directions")

    data = res.json()
    if data.get("status") != "OK":
        raise HTTPException(status_code=502, detail=f"Google Directions: {data.get('status')}")

    route = data["routes"][0]
    duration = sum(leg["duration"]["value"] for leg in route["legs"])
    distance = sum(leg["distance"]["value"] for leg in route["legs"])

    return {
        "polyline": route["overview_polyline"]["points"],
        "duration": duration,
        "distance": distance,
    }
