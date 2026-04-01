from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel

class Itinerary(SQLModel, table=True):

    id: int | None = Field(default=None, primary_key=True)
    nom: str
    nb_jours: int
    description: str
    date_creation: datetime = Field(default_factory=datetime.now)                                                                                                           


class Favorite(SQLModel, table=True):
    """
    A saved place ("favori") independent from a trip.
    """

    id: int | None = Field(default=None, primary_key=True)
    nom: str
    category: str = "Lieu"
    continent: Optional[str] = None
    latitude: float
    longitude: float
    source_url: Optional[str] = None  # e.g. TikTok URL later
    properties: dict = Field(default_factory=dict, sa_column=Column(JSON))
    date_creation: datetime = Field(default_factory=datetime.now)

class POI(SQLModel, table=True):

    id: int | None = Field(default=None, primary_key=True)
    itinerary_id: int = Field(default=None, foreign_key="itinerary.id")
    favorite_id: Optional[int] = Field(default=None, foreign_key="favorite.id")
    nom: str
    category: str
    latitude: float
    longitude: float
    properties: dict = Field(default_factory=dict, sa_column=Column(JSON))
    day: Optional[int] = None
    position: Optional[int] = None
    travel_mode: Optional[str] = None  # "driving" | "walking" | "cycling"
    date_creation: datetime = Field(default_factory=datetime.now)  