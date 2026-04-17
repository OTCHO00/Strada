"""
Client OpenTripMap — POIs notés pour visites, restaurants et loisirs.
API gratuite : 5 000 requêtes/jour — https://opentripmap.io/product

Chaque lieu retourné a un score basé sur le rate OpenTripMap (0-3) :
  rate 3 → score 99  (incontournable)
  rate 2 → score 66  (très intéressant)
  rate 1 → score 33  (intéressant)
  rate 0 → score 10  (non noté)
"""

import os
from pathlib import Path

import httpx

# Charge le .env si python-dotenv est disponible
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass

from .overpass import RawPOI

OPENTRIPMAP_BASE = "https://api.opentripmap.com/0.1/en/places"

# Catégories OpenTripMap → catégorie normalisée
VISIT_KINDS = (
    "interesting_places,cultural,museums,architecture,"
    "historic,art_galleries,theatres_and_entertainments"
)
FOOD_KINDS = "foods,restaurants,cafes,bars"
LEISURE_KINDS = "natural,parks,gardens,beaches,sport"

RATE_TO_SCORE = {3: 99, 2: 66, 1: 33, 0: 10}


def _get_api_key() -> str | None:
    return os.getenv("OPENTRIPMAP_API_KEY")


async def fetch_pois_opentripmap(
    lat: float, lon: float, radius_km: int = 8
) -> list[RawPOI]:
    """
    Récupère des POIs de qualité via OpenTripMap.
    Retourne visites (rate≥2), restaurants (rate≥1), loisirs (rate≥1).
    Lève ValueError si la clé API n'est pas configurée.
    """
    api_key = _get_api_key()
    if not api_key:
        raise ValueError("OPENTRIPMAP_API_KEY non définie")

    visits, food, leisure = await _fetch_all_categories(lat, lon, radius_km, api_key)
    return visits + food + leisure


async def _fetch_all_categories(
    lat: float, lon: float, radius_km: int, api_key: str
) -> tuple[list[RawPOI], list[RawPOI], list[RawPOI]]:
    radius_m = radius_km * 1000

    async with httpx.AsyncClient(timeout=15) as client:
        visit_data, food_data, leisure_data = await _parallel_fetch(
            client, lat, lon, radius_m, api_key
        )

    visits = _parse_response(visit_data, "visit", min_rate=2)
    food = _parse_response(food_data, "food", min_rate=1)
    leisure = _parse_response(leisure_data, "leisure", min_rate=1)

    return visits, food, leisure


async def _parallel_fetch(
    client: httpx.AsyncClient,
    lat: float,
    lon: float,
    radius_m: int,
    api_key: str,
) -> tuple[list, list, list]:
    import asyncio

    async def _get(kinds: str, limit: int = 30) -> list:
        params = {
            "radius": radius_m,
            "lon": lon,
            "lat": lat,
            "kinds": kinds,
            "format": "json",
            "limit": limit,
            "apikey": api_key,
        }
        try:
            resp = await client.get(f"{OPENTRIPMAP_BASE}/radius", params=params)
            resp.raise_for_status()
            return resp.json() if isinstance(resp.json(), list) else []
        except Exception:
            return []

    return await asyncio.gather(
        _get(VISIT_KINDS, 40),
        _get(FOOD_KINDS, 25),
        _get(LEISURE_KINDS, 20),
    )


def _parse_response(data: list, category: str, min_rate: int) -> list[RawPOI]:
    pois: list[RawPOI] = []
    seen: set[str] = set()

    for place in data:
        name = (place.get("name") or "").strip()
        if not name or name in seen:
            continue
        seen.add(name)

        rate = place.get("rate", 0)
        if rate < min_rate:
            continue

        point = place.get("point", {})
        lat = point.get("lat")
        lon = point.get("lon")
        if lat is None or lon is None:
            continue

        kinds = place.get("kinds", "")
        raw_category = kinds.split(",")[0] if kinds else category

        pois.append(RawPOI(
            nom=name,
            category=category,
            raw_category=raw_category,
            lat=lat,
            lon=lon,
            tags={"xid": place.get("xid", ""), "kinds": kinds, "rate": rate},
            score=RATE_TO_SCORE.get(rate, 10),
        ))

    pois.sort(key=lambda p: p.score, reverse=True)
    return pois
