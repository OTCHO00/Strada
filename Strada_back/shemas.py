from datetime import date
from pydantic import BaseModel, Json

class Itineraire(BaseModel):

    nom: str
    nb_jours: int
    description: str

class PoiCreate(BaseModel):

    nom: str
    category: str
    latitude: float
    longitude: float
    properties: dict

class PoiRead(BaseModel):

    nom: str
    category: str
    latitude: float
    longitude: float

    class Config:

        from_attributes = True 