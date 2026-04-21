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


class NearbyRequest(BaseModel):
    lat: float
    lng: float
    radius: int = 200


@router.post("/nearby")
async def search_nearby(payload: NearbyRequest):
    if not GOOGLE_KEY:
        raise HTTPException(status_code=500, detail="GOOGLE_PLACES_KEY non configurée")

    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://places.googleapis.com/v1/places:searchNearby",
            headers={
                "X-Goog-Api-Key": GOOGLE_KEY,
                "X-Goog-FieldMask": "places.displayName,places.location,places.types,places.rating,places.priceLevel",
            },
            json={
                "locationRestriction": {
                    "circle": {
                        "center": {"latitude": payload.lat, "longitude": payload.lng},
                        "radius": float(payload.radius),
                    }
                },
                "includedTypes": [
                    "restaurant", "cafe", "bar", "bakery",
                    "museum", "art_gallery",
                    "park", "amusement_park", "zoo", "aquarium",
                    "night_club", "movie_theater", "bowling_alley",
                    "spa", "shopping_mall", "book_store", "clothing_store",
                    "church", "mosque", "synagogue", "hindu_temple",
                    "library", "stadium",
                ],
                "maxResultCount": 10,
            },
            timeout=10,
        )

    if not res.is_success:
        print(f"[Nearby] Google error {res.status_code}: {res.text}")
        raise HTTPException(status_code=502, detail=f"Google Places Nearby: {res.status_code} – {res.text}")

    data = res.json()
    places = []
    for p in data.get("places", []):
        loc = p.get("location", {})
        places.append({
            "name": p.get("displayName", {}).get("text", "Lieu"),
            "lat": loc.get("latitude"),
            "lng": loc.get("longitude"),
            "types": p.get("types", []),
            "rating": p.get("rating"),
        })

    return {"places": places}
