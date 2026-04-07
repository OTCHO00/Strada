"""
Moteur de génération automatique d'itinéraire.

Deux modes :
  - Mode VILLE  : destination = ville  → planning jour par jour dans une ville
  - Mode PAYS   : destination = pays   → road-trip multi-villes
"""

import math

from .geocoding import detect_destination
from .overpass import RawPOI, fetch_cities_for_country, fetch_pois_for_city

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------

MAX_POIS_PER_DAY = 6        # Nombre max de POIs dans une journée
MIN_DAYS_PER_CITY = 2       # Minimum de jours par ville en mode PAYS
TRANSPORT_THRESHOLD_KM = 200  # Au-delà → jour de transport ajouté
MAX_CITIES = 9              # Nombre max de villes sélectionnées en mode PAYS


# ---------------------------------------------------------------------------
# Point d'entrée public
# ---------------------------------------------------------------------------

async def generate_itinerary(destination: str, nb_jours: int) -> list[dict]:
    """
    Génère un itinéraire complet.

    Retourne une liste de POIs avec les champs :
      nom, category, raw_category, lat, lon, day, position, properties
    """
    dest = await detect_destination(destination)

    if dest["type"] == "country" and dest["bbox"] and nb_jours > 5:
        return await _generate_country_plan(dest, nb_jours)
    else:
        return await _generate_city_plan(dest, nb_jours)


# ---------------------------------------------------------------------------
# Mode VILLE
# ---------------------------------------------------------------------------

async def _generate_city_plan(
    dest: dict,
    nb_jours: int,
    day_offset: int = 0,
    used_food: set[str] | None = None,
    used_leisure: set[str] | None = None,
) -> list[dict]:
    """
    Génère les journées pour une ville.
    day_offset : décalage pour les itinéraires multi-villes.
    """
    used_food = used_food if used_food is not None else set()
    used_leisure = used_leisure if used_leisure is not None else set()

    pois = await fetch_pois_for_city(dest["lat"], dest["lon"])

    visits = [p for p in pois if p.category == "visit"]
    food = [p for p in pois if p.category == "food"]
    leisure = [p for p in pois if p.category == "leisure"]

    if not visits:
        return []

    # Limiter les visites au strict nécessaire (5 visites/jour max)
    visits = visits[: nb_jours * 5]
    effective_days = min(nb_jours, len(visits))

    # Cluster les visites en effective_days groupes géographiques
    points = [(v.lat, v.lon) for v in visits]
    assignments = _kmeans(points, effective_days)

    clusters: dict[int, list[RawPOI]] = {}
    for i, cid in enumerate(assignments):
        clusters.setdefault(cid, []).append(visits[i])

    # Calculer le centre de chaque cluster
    centers = {
        cid: (
            sum(p.lat for p in ps) / len(ps),
            sum(p.lon for p in ps) / len(ps),
        )
        for cid, ps in clusters.items()
    }

    # Trier les clusters ouest → est (longitude croissante)
    sorted_cluster_ids = sorted(centers.keys(), key=lambda cid: centers[cid][1])

    result: list[dict] = []

    for day_index, cid in enumerate(sorted_cluster_ids):
        day_num = day_offset + day_index + 1
        c_lat, c_lon = centers[cid]

        # Visites du cluster, ordonnées par nearest-neighbor
        cluster_visits = _nearest_neighbor_order(clusters[cid])

        # Nourriture la plus proche, non encore utilisée
        available_food = [f for f in food if f.nom not in used_food]
        day_food = _pick_nearby(available_food, c_lat, c_lon, 2)
        used_food.update(f.nom for f in day_food)

        # Loisir le plus proche, non encore utilisé
        available_leisure = [l for l in leisure if l.nom not in used_leisure]
        day_leisure = _pick_nearby(available_leisure, c_lat, c_lon, 1)
        used_leisure.update(l.nom for l in day_leisure)

        # Composer la journée avec alternance visite / repas
        day_pois = _compose_day(cluster_visits, day_food, day_leisure)

        # Ré-ordonner la journée complète (nearest-neighbor)
        day_pois = _nearest_neighbor_order(day_pois)

        for position, poi in enumerate(day_pois):
            result.append({
                "nom": poi.nom,
                "category": poi.category,
                "raw_category": poi.raw_category,
                "lat": poi.lat,
                "lon": poi.lon,
                "day": day_num,
                "position": position,
                "properties": {"source": "overpass", "tags": poi.tags},
            })

    return result


# ---------------------------------------------------------------------------
# Mode PAYS
# ---------------------------------------------------------------------------

async def _generate_country_plan(dest: dict, nb_jours: int) -> list[dict]:
    """
    Génère un road-trip multi-villes pour un pays.
    """
    all_cities = await fetch_cities_for_country(dest["bbox"])
    if not all_cities:
        # Fallback : traiter comme une ville
        return await _generate_city_plan(dest, nb_jours)

    # Sélectionner des villes géographiquement diversifiées
    nb_cities = min(MAX_CITIES, max(3, nb_jours // MIN_DAYS_PER_CITY))
    selected = _select_diverse_cities(all_cities, nb_cities)

    # Ordonner les villes (circuit nearest-neighbor)
    ordered = _order_cities(selected)

    # Répartir les jours en tenant compte des trajets
    days_per_city, transport_flags = _distribute_days(ordered, nb_jours)

    result: list[dict] = []
    current_day = 0
    used_food: set[str] = set()
    used_leisure: set[str] = set()

    for i, city in enumerate(ordered):
        n_days = days_per_city[i]
        if n_days < 1:
            continue

        city_dest = {"lat": city["lat"], "lon": city["lon"], "name": city["name"]}
        city_pois = await _generate_city_plan(
            city_dest, n_days, day_offset=current_day,
            used_food=used_food, used_leisure=used_leisure,
        )
        result.extend(city_pois)
        current_day += n_days

        # Ajouter un jour de transport si nécessaire
        if i < len(ordered) - 1 and transport_flags[i]:
            next_city = ordered[i + 1]
            current_day += 1
            result.append({
                "nom": f"Trajet : {city['name']} → {next_city['name']}",
                "category": "transport",
                "raw_category": "transport",
                "lat": (city["lat"] + next_city["lat"]) / 2,
                "lon": (city["lon"] + next_city["lon"]) / 2,
                "day": current_day,
                "position": 0,
                "properties": {"type": "transport"},
            })

    return result


# ---------------------------------------------------------------------------
# Sélection et ordonnancement des villes (Mode PAYS)
# ---------------------------------------------------------------------------

def _select_diverse_cities(cities: list[dict], n: int) -> list[dict]:
    """
    Sélectionne n villes en maximisant la diversité géographique.
    Algorithme : prend la plus peuplée, puis itère en choisissant
    la ville la plus éloignée des villes déjà sélectionnées.
    """
    if len(cities) <= n:
        return cities

    selected = [cities[0]]  # plus grande ville en premier
    remaining = cities[1:]

    while len(selected) < n and remaining:
        # Choisir la ville la plus éloignée de toutes les villes déjà choisies
        best = max(
            remaining,
            key=lambda c: min(
                _haversine(c["lat"], c["lon"], s["lat"], s["lon"]) for s in selected
            ),
        )
        selected.append(best)
        remaining.remove(best)

    return selected


def _order_cities(cities: list[dict]) -> list[dict]:
    """
    Ordonne les villes en circuit nearest-neighbor (TSP greedy).
    Démarre par la ville la plus à l'ouest.
    """
    remaining = list(cities)
    remaining.sort(key=lambda c: c["lon"])
    ordered = [remaining.pop(0)]

    while remaining:
        last = ordered[-1]
        nearest = min(
            remaining,
            key=lambda c: _haversine(last["lat"], last["lon"], c["lat"], c["lon"]),
        )
        remaining.remove(nearest)
        ordered.append(nearest)

    return ordered


def _distribute_days(
    cities: list[dict], nb_jours: int
) -> tuple[list[int], list[bool]]:
    """
    Répartit nb_jours entre les villes et détermine les jours de transport.

    Retourne :
      - days_per_city : liste du nombre de jours par ville
      - transport_flags : True si un jour de transport est ajouté après cette ville
    """
    n = len(cities)
    transport_flags: list[bool] = []

    # Calculer les jours de transport nécessaires
    for i in range(n - 1):
        dist = _haversine(
            cities[i]["lat"], cities[i]["lon"],
            cities[i + 1]["lat"], cities[i + 1]["lon"],
        )
        transport_flags.append(dist > TRANSPORT_THRESHOLD_KM)
    transport_flags.append(False)  # dernière ville

    nb_transport_days = sum(transport_flags)
    available_days = max(nb_jours - nb_transport_days, n * MIN_DAYS_PER_CITY)

    # Poids par ville (population normalisée, fallback égal)
    pops = [c.get("population", 0) for c in cities]
    total_pop = sum(pops)
    if total_pop == 0:
        weights = [1.0 / n] * n
    else:
        weights = [p / total_pop for p in pops]

    # Répartition proportionnelle, minimum MIN_DAYS_PER_CITY
    raw = [max(MIN_DAYS_PER_CITY, round(w * available_days)) for w in weights]

    # Ajustement pour atteindre exactement available_days
    diff = available_days - sum(raw)
    for i in range(abs(diff)):
        idx = i % n
        raw[idx] += 1 if diff > 0 else -1
        if raw[idx] < MIN_DAYS_PER_CITY:
            raw[idx] = MIN_DAYS_PER_CITY

    return raw, transport_flags


# ---------------------------------------------------------------------------
# Algorithmes géométriques
# ---------------------------------------------------------------------------

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance en kilomètres entre deux points GPS."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))


def _dist2(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Distance euclidienne au carré (suffisant pour comparaisons relatives)."""
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2


def _kmeans(
    points: list[tuple[float, float]], k: int, max_iter: int = 30
) -> list[int]:
    """
    K-means simplifié sans dépendance externe.
    Initialisation : k centroïdes répartis uniformément sur les points triés.
    Retourne la liste des indices de cluster pour chaque point.
    """
    n = len(points)
    if n == 0:
        return []
    k = min(k, n)
    if k == 1:
        return [0] * n

    # Initialisation des centroïdes (répartition uniforme)
    sorted_idx = sorted(range(n), key=lambda i: points[i][0] + points[i][1])
    step = max(1, n // k)
    centroids: list[tuple[float, float]] = [
        points[sorted_idx[min(i * step, n - 1)]] for i in range(k)
    ]

    assignments = [-1] * n

    for _ in range(max_iter):
        new_assignments = [
            min(range(k), key=lambda j: _dist2(points[i], centroids[j]))
            for i in range(n)
        ]
        if new_assignments == assignments:
            break
        assignments = new_assignments

        # Recalcul des centroïdes
        for j in range(k):
            cluster = [points[i] for i in range(n) if assignments[i] == j]
            if cluster:
                centroids[j] = (
                    sum(p[0] for p in cluster) / len(cluster),
                    sum(p[1] for p in cluster) / len(cluster),
                )

    return assignments


def _nearest_neighbor_order(pois: list[RawPOI]) -> list[RawPOI]:
    """
    Trie les POIs en circuit greedy nearest-neighbor.
    Complexité O(n²), acceptable pour n ≤ 15.
    """
    if not pois:
        return []
    remaining = list(pois)
    ordered = [remaining.pop(0)]
    while remaining:
        last = ordered[-1]
        nearest = min(
            remaining,
            key=lambda p: _dist2((last.lat, last.lon), (p.lat, p.lon)),
        )
        remaining.remove(nearest)
        ordered.append(nearest)
    return ordered


def _pick_nearby(
    pool: list[RawPOI], center_lat: float, center_lon: float, n: int
) -> list[RawPOI]:
    """Retourne les n POIs les plus proches du centre donné."""
    return sorted(pool, key=lambda p: _dist2((p.lat, p.lon), (center_lat, center_lon)))[:n]


def _compose_day(
    visits: list[RawPOI],
    food: list[RawPOI],
    leisure: list[RawPOI],
) -> list[RawPOI]:
    """
    Compose une journée réaliste en intercalant visites, repas et loisirs.
    Schéma cible : visite → visite → repas → visite → loisir → repas
    """
    result: list[RawPOI] = []
    food_idx = 0
    leisure_added = False

    for i, v in enumerate(visits[:MAX_POIS_PER_DAY - len(food)]):
        result.append(v)

        # Repas du midi après les 2 premières visites
        if i == 1 and food_idx < len(food):
            result.append(food[food_idx])
            food_idx += 1
            # Loisir de l'après-midi
            if not leisure_added and leisure:
                result.append(leisure[0])
                leisure_added = True

    # Repas du soir en fin de journée
    if food_idx < len(food):
        result.append(food[food_idx])

    return result
