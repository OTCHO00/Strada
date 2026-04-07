from dataclasses import dataclass, field

import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Correspondance tag OSM → catégorie normalisée
CATEGORY_MAP: dict[str, str] = {
    # visites
    "museum": "visit",
    "attraction": "visit",
    "viewpoint": "visit",
    "gallery": "visit",
    "artwork": "visit",
    "monument": "visit",
    "castle": "visit",
    "ruins": "visit",
    "archaeological_site": "visit",
    "memorial": "visit",
    # restauration
    "restaurant": "food",
    "cafe": "food",
    "fast_food": "food",
    "bar": "food",
    # loisirs
    "park": "leisure",
    "garden": "leisure",
    "beach": "leisure",
    "nature_reserve": "leisure",
    "theme_park": "leisure",
    "zoo": "leisure",
    "aquarium": "leisure",
}


@dataclass
class RawPOI:
    nom: str
    category: str       # "visit" | "food" | "leisure"
    raw_category: str   # valeur brute du tag OSM
    lat: float
    lon: float
    tags: dict = field(default_factory=dict)


async def fetch_pois_for_city(lat: float, lon: float, radius_km: int = 8) -> list[RawPOI]:
    """
    Récupère les POIs autour du centre d'une ville via Overpass API.
    Plafond à 60 résultats, triés par importance (présence wikidata, nombre de tags).
    """
    radius_m = radius_km * 1000
    query = f"""
[out:json][timeout:30];
(
  node["tourism"~"museum|attraction|viewpoint|gallery|artwork|monument"]["name"](around:{radius_m},{lat},{lon});
  node["amenity"~"restaurant|cafe"]["name"](around:{radius_m},{lat},{lon});
  node["leisure"~"park|garden|beach|nature_reserve|theme_park|zoo|aquarium"]["name"](around:{radius_m},{lat},{lon});
  node["historic"~"castle|ruins|archaeological_site|memorial"]["name"](around:{radius_m},{lat},{lon});
  way["tourism"~"museum|attraction|viewpoint"]["name"](around:{radius_m},{lat},{lon});
  way["historic"~"castle|ruins"]["name"](around:{radius_m},{lat},{lon});
);
out center body 80;
"""
    async with httpx.AsyncClient(timeout=45) as client:
        resp = await client.post(OVERPASS_URL, data={"data": query})
        resp.raise_for_status()
        data = resp.json()

    pois: list[RawPOI] = []
    seen: set[str] = set()

    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name", "").strip()
        if not name or name in seen:
            continue
        seen.add(name)

        # Coordonnées (node vs way)
        if el["type"] == "node":
            p_lat, p_lon = el["lat"], el["lon"]
        else:
            center = el.get("center", {})
            p_lat = center.get("lat", lat)
            p_lon = center.get("lon", lon)

        raw_cat, category = _classify(tags)
        if not category:
            continue

        pois.append(RawPOI(nom=name, category=category, raw_category=raw_cat,
                           lat=p_lat, lon=p_lon, tags=tags))

    # Trier par importance (wikidata/wikipedia en premier, puis nombre de tags)
    pois.sort(
        key=lambda p: ("wikidata" in p.tags or "wikipedia" in p.tags, len(p.tags)),
        reverse=True,
    )
    return pois[:60]


async def fetch_cities_for_country(bbox: list[float]) -> list[dict]:
    """
    Récupère les villes majeures d'un pays à partir de son bounding box.
    Retourne une liste de {name, lat, lon, population, place_type}.
    """
    min_lat, max_lat, min_lon, max_lon = bbox

    query = f"""
[out:json][timeout:30];
(
  node["place"~"city|town"]["name"]({min_lat},{min_lon},{max_lat},{max_lon});
);
out body 150;
"""
    async with httpx.AsyncClient(timeout=45) as client:
        resp = await client.post(OVERPASS_URL, data={"data": query})
        resp.raise_for_status()
        data = resp.json()

    cities: list[dict] = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name", "").strip()
        if not name:
            continue

        pop_raw = tags.get("population", "0").replace(",", "").replace(".", "").replace(" ", "")
        try:
            population = int(pop_raw)
        except ValueError:
            population = 0

        cities.append({
            "name": name,
            "lat": el["lat"],
            "lon": el["lon"],
            "population": population,
            "place_type": tags.get("place", "town"),
        })

    # Villes (city) en premier, puis tri par population décroissante
    cities.sort(key=lambda c: (c["place_type"] == "city", c["population"]), reverse=True)
    return cities[:80]


# ---------------------------------------------------------------------------
# Helpers privés
# ---------------------------------------------------------------------------

def _classify(tags: dict) -> tuple[str, str | None]:
    """Retourne (raw_category, catégorie normalisée) ou ('' , None) si non reconnu."""
    for key in ("tourism", "amenity", "leisure", "historic"):
        val = tags.get(key, "")
        if val in CATEGORY_MAP:
            return val, CATEGORY_MAP[val]
    # Fallback : n'importe quel tag tourism/historic inconnu → visite
    if "historic" in tags:
        return tags["historic"], "visit"
    if "tourism" in tags:
        return tags["tourism"], "visit"
    return "", None
