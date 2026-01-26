from database import engine
from typing import Annotated
from models import Itinerary, POI
from sqlmodel import SQLModel, Session, select
from shemas import Itineraire, PoiCreate, PoiRead
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, FastAPI, HTTPException

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:

        yield session

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

#GET

@app.get("/itineraire")
def get_all_itineraire(session: Annotated[Session, Depends(get_session)]):

    return session.exec(select(Itinerary)).all()

@app.get("/itineraire/{id}")
def get_all_itineraire_by_id(id: int, session: Annotated[Session, Depends(get_session)]):

    itineraire_db = session.exec(select(Itinerary).where(Itinerary.id == id)).first()

    return itineraire_db

#POST

@app.post("/itineraire")
def create_itineraire(itineraire: Itineraire, session: Annotated[Session, Depends(get_session)]):

    itineraire_db = Itinerary(**itineraire.model_dump())

    session.add(itineraire_db)
    session.commit()
    session.refresh(itineraire_db)

    return itineraire_db

@app.post("/itineraire/{itineraire_id}/poi", response_model=PoiRead)
def create_itineraire(itineraire_id: int, poi: PoiCreate, session: Annotated[Session, Depends(get_session)]):

    itineraire = session.exec(select(Itinerary).where(Itinerary.id == itineraire_id)).first()

    if not itineraire:
        raise HTTPException(status_code=404, detail="Itinéraire non trouvé")

    poi_db = POI(**poi.model_dump(), itinerary_id=itineraire_id)

    session.add(poi_db)
    session.commit()
    session.refresh(poi_db)

    return PoiRead.from_orm(poi_db)

@app.delete("/itineraire/{id}")
def delete_itineraire_by_id(id: int, session: Annotated[Session, Depends(get_session)]):

    itineraire_db = session.exec(select(Itinerary).where(Itinerary.id == id)).first()

    if itineraire_db is None:

        raise HTTPException(status_code=401, detail="L'itinéraire n'existe pas ")

    session.delete(itineraire_db)
    session.commit()

    return {"message" : "Itinéraire bien supprimé"}

@app.delete("/itineraire/{itineraire_id}/poi/{poi_id}")
def delete_itineraire_by_id(itineraire_id: int, poi_id: int, session: Annotated[Session, Depends(get_session)]):

    poi_db = session.exec(select(POI).where((POI.id == poi_id) & (POI.itinerary_id == itineraire_id))).first()

    if poi_db is None:

        raise HTTPException(status_code=401, detail="Le POI n'existe pas ")

    session.delete(poi_db)
    session.commit()

    return {"message" : "POI bien supprimé"}