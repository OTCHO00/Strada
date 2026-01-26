from sqlalchemy import JSON
from datetime import datetime
from sqlmodel import SQLModel, Field, Column

class Itinerary(SQLModel, table=True):

    id: int | None = Field(default=None, primary_key=True)
    nom: str
    nb_jours: int
    description: str
    date_creation: datetime = Field(default_factory=datetime.now)                                                                                                           

class POI(SQLModel, table=True):

    id: int | None = Field(default=None, primary_key=True)
    itinerary_id: int = Field(default=None, foreign_key="itinerary.id")
    nom: str
    category: str
    latitude: float
    longitude: float
    properties: dict = Field(default_factory=dict, sa_column=Column(JSON))
    date_creation: datetime = Field(default_factory=datetime.now)  