import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


async def detect_destination(query: str) -> dict:
    """
    Appelle Nominatim pour déterminer si la destination est une ville ou un pays.

    Retourne:
    {
        "type": "city" | "country",
        "name": str,
        "lat": float,
        "lon": float,
        "bbox": [min_lat, max_lat, min_lon, max_lon] | None,
        "country_code": str | None,
    }
    """
    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "addressdetails": 1,
    }
    headers = {"User-Agent": "Strada-App/1.0 (travel planner)"}

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(NOMINATIM_URL, params=params, headers=headers)
        resp.raise_for_status()
        results = resp.json()

    if not results:
        raise ValueError(f"Destination '{query}' introuvable.")

    r = results[0]
    place_rank = int(r.get("place_rank", 16))
    bbox = r.get("boundingbox", [])
    address = r.get("address", {})

    # place_rank <= 10 = pays ou région → Mode PAYS
    dest_type = "country" if place_rank <= 10 else "city"

    return {
        "type": dest_type,
        "name": r.get("display_name", query).split(",")[0].strip(),
        "lat": float(r["lat"]),
        "lon": float(r["lon"]),
        "bbox": [float(x) for x in bbox] if len(bbox) == 4 else None,
        "country_code": address.get("country_code"),
    }
