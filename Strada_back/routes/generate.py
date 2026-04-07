from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from database import engine
from models import Itinerary, POI
from services.itinerary_generator import generate_itinerary
from shemas import PoiRead

router = APIRouter()


def get_session():
    with Session(engine) as session:
        yield session


class GenerateRequest(BaseModel):
    destination: str


@router.post("/itineraire/{itineraire_id}/generate", response_model=list[PoiRead])
async def generate_itinerary_route(
    itineraire_id: int,
    payload: GenerateRequest,
    session: Annotated[Session, Depends(get_session)],
):
    """
    Génère automatiquement un itinéraire pour un voyage existant.

    - Supprime les POIs existants de l'itinéraire
    - Appelle le moteur de génération (mode VILLE ou PAYS)
    - Sauvegarde les POIs générés en base
    - Retourne le plan complet
    """
    itinerary = session.exec(select(Itinerary).where(Itinerary.id == itineraire_id)).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinéraire non trouvé")

    # Suppression des POIs existants
    existing_pois = session.exec(select(POI).where(POI.itinerary_id == itineraire_id)).all()
    for poi in existing_pois:
        session.delete(poi)
    session.commit()

    # Génération de l'itinéraire
    try:
        generated = await generate_itinerary(payload.destination, itinerary.nb_jours)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Erreur lors de la génération : {e}")

    if not generated:
        raise HTTPException(
            status_code=422,
            detail=f"Aucun lieu trouvé pour '{payload.destination}'. Essaie une ville plus grande.",
        )

    # Sauvegarde en base
    saved: list[POI] = []
    for poi_data in generated:
        poi_db = POI(
            itinerary_id=itineraire_id,
            nom=poi_data["nom"],
            category=poi_data["category"],
            latitude=poi_data["lat"],
            longitude=poi_data["lon"],
            properties=poi_data.get("properties", {}),
            day=poi_data["day"],
            position=poi_data["position"],
            travel_mode="walking",
        )
        session.add(poi_db)
        saved.append(poi_db)

    session.commit()
    for poi_db in saved:
        session.refresh(poi_db)

    return saved
