from database import engine
from typing import Annotated
from models import Favorite, Itinerary, POI
from sqlmodel import SQLModel, Session, select
from shemas import FavoriteCreate, FavoriteRead, Itineraire, ItineraireUpdate, PlanFromFavorite, PoiCreate, PoiRead, PoiUpdate
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, FastAPI, HTTPException
from routes.generate import router as generate_router
from routes.directions import router as directions_router

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:

        yield session

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://strada-front.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate_router)
app.include_router(directions_router)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

#GET

@app.get("/itineraire")
def get_all_itineraire(session: Annotated[Session, Depends(get_session)]):
    itineraries = session.exec(select(Itinerary)).all()
    out = []
    for it in itineraries:
        n = len(session.exec(select(POI).where(POI.itinerary_id == it.id)).all())
        row = it.model_dump()
        row["poi_count"] = n
        out.append(row)
    return out

@app.get("/itineraire/{id}")
def get_all_itineraire_by_id(id: int, session: Annotated[Session, Depends(get_session)]):

    itineraire_db = session.exec(select(Itinerary).where(Itinerary.id == id)).first()

    return itineraire_db


@app.get("/favorites", response_model=list[FavoriteRead])
def list_favorites(
    session: Annotated[Session, Depends(get_session)],
    continent: str | None = None,
):
    stmt = select(Favorite)
    if continent:
        stmt = stmt.where(Favorite.continent == continent)
    return session.exec(stmt).all()

#POST

@app.post("/itineraire")
def create_itineraire(itineraire: Itineraire, session: Annotated[Session, Depends(get_session)]):

    itineraire_db = Itinerary(**itineraire.model_dump())

    session.add(itineraire_db)
    session.commit()
    session.refresh(itineraire_db)

    return itineraire_db

@app.patch("/itineraire/{itineraire_id}")
def update_itineraire(itineraire_id: int, data: ItineraireUpdate, session: Annotated[Session, Depends(get_session)]):
    itin = session.get(Itinerary, itineraire_id)
    if not itin:
        raise HTTPException(status_code=404, detail="Itinéraire non trouvé")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(itin, field, value)
    session.add(itin)
    session.commit()
    session.refresh(itin)
    return itin

@app.post("/favorites", response_model=FavoriteRead)
def create_favorite(
    favorite: FavoriteCreate,
    session: Annotated[Session, Depends(get_session)],
):
    favorite_db = Favorite(**favorite.model_dump())
    session.add(favorite_db)
    session.commit()
    session.refresh(favorite_db)
    return favorite_db


@app.delete("/favorites/{favorite_id}")
def delete_favorite(
    favorite_id: int,
    session: Annotated[Session, Depends(get_session)],
):
    favorite_db = session.exec(select(Favorite).where(Favorite.id == favorite_id)).first()
    if favorite_db is None:
        raise HTTPException(status_code=404, detail="Le favori n'existe pas")
    for poi in session.exec(select(POI).where(POI.favorite_id == favorite_id)):
        poi.favorite_id = None
        session.add(poi)
    session.delete(favorite_db)
    session.commit()
    return {"message": "Favori bien supprimé"}


@app.post("/itineraire/{itineraire_id}/poi", response_model=PoiRead)
def create_poi(itineraire_id: int, poi: PoiCreate, session: Annotated[Session, Depends(get_session)]):

    itineraire = session.exec(select(Itinerary).where(Itinerary.id == itineraire_id)).first()

    if not itineraire:
        raise HTTPException(status_code=404, detail="Itinéraire non trouvé")

    poi_db = POI(**poi.model_dump(), itinerary_id=itineraire_id)

    session.add(poi_db)
    session.commit()
    session.refresh(poi_db)

    return PoiRead.from_orm(poi_db)


@app.post("/itineraire/{itineraire_id}/plan/from-favorite", response_model=PoiRead)
def add_favorite_to_plan(
    itineraire_id: int,
    payload: PlanFromFavorite,
    session: Annotated[Session, Depends(get_session)],
):
    itinerary = session.exec(select(Itinerary).where(Itinerary.id == itineraire_id)).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinéraire non trouvé")

    favorite = session.exec(select(Favorite).where(Favorite.id == payload.favorite_id)).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favori non trouvé")

    position = payload.position
    if position is None:
        if payload.day is None:
            pois = session.exec(select(POI).where(POI.itinerary_id == itineraire_id)).all()
            pool = [p for p in pois if p.day is None]
            max_pos = max((p.position for p in pool if p.position is not None), default=-1)
            position = max_pos + 1
        else:
            last = session.exec(
                select(POI)
                .where((POI.itinerary_id == itineraire_id) & (POI.day == payload.day))
                .order_by(POI.position.desc(), POI.id.desc())
            ).first()
            position = (last.position + 1) if (last and last.position is not None) else 0

    poi_db = POI(
        itinerary_id=itineraire_id,
        favorite_id=favorite.id,
        nom=favorite.nom,
        category=favorite.category,
        latitude=favorite.latitude,
        longitude=favorite.longitude,
        properties=favorite.properties or {},
        day=payload.day,
        position=position,
        travel_mode=payload.travel_mode,
    )
    session.add(poi_db)
    session.commit()
    session.refresh(poi_db)
    return PoiRead.from_orm(poi_db)


@app.patch("/itineraire/{itineraire_id}/poi/{poi_id}", response_model=PoiRead)
def update_poi_plan_fields(
    itineraire_id: int,
    poi_id: int,
    poi: PoiUpdate,
    session: Annotated[Session, Depends(get_session)],
):
    poi_db = session.exec(
        select(POI).where((POI.id == poi_id) & (POI.itinerary_id == itineraire_id))
    ).first()
    if not poi_db:
        raise HTTPException(status_code=404, detail="POI non trouvé")

    for field, value in poi.model_dump(exclude_unset=True).items():
        setattr(poi_db, field, value)

    session.add(poi_db)
    session.commit()
    session.refresh(poi_db)
    return PoiRead.from_orm(poi_db)


@app.get("/itineraire/{itineraire_id}/plan", response_model=list[PoiRead])
def get_itinerary_plan(
    itineraire_id: int,
    session: Annotated[Session, Depends(get_session)],
):
    itinerary = session.exec(select(Itinerary).where(Itinerary.id == itineraire_id)).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinéraire non trouvé")

    pois = session.exec(
        select(POI)
        .where(POI.itinerary_id == itineraire_id)
        .order_by(POI.day, POI.position, POI.id)
    ).all()
    return pois

@app.delete("/itineraire/{id}")
def delete_itineraire_by_id(id: int, session: Annotated[Session, Depends(get_session)]):

    itineraire_db = session.exec(select(Itinerary).where(Itinerary.id == id)).first()

    if itineraire_db is None:

        raise HTTPException(status_code=404, detail="L'itinéraire n'existe pas ")

    for poi in session.exec(select(POI).where(POI.itinerary_id == id)):
        session.delete(poi)
    session.delete(itineraire_db)
    session.commit()

    return {"message" : "Itinéraire bien supprimé"}

@app.delete("/itineraire/{itineraire_id}/poi/{poi_id}")
def delete_itineraire_by_id(itineraire_id: int, poi_id: int, session: Annotated[Session, Depends(get_session)]):

    poi_db = session.exec(select(POI).where((POI.id == poi_id) & (POI.itinerary_id == itineraire_id))).first()

    if poi_db is None:

        raise HTTPException(status_code=404, detail="Le POI n'existe pas ")

    session.delete(poi_db)
    session.commit()

    return {"message" : "POI bien supprimé"}