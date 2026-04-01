from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

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
    favorite_id: Optional[int] = None
    day: Optional[int] = None
    position: Optional[int] = None
    travel_mode: Optional[str] = None

class PoiRead(BaseModel):

    id: int
    nom: str
    category: str
    latitude: float
    longitude: float
    properties: Optional[dict] = None
    favorite_id: Optional[int] = None
    day: Optional[int] = None
    position: Optional[int] = None
    travel_mode: Optional[str] = None

    class Config:

        from_attributes = True


class PoiUpdate(BaseModel):
    """PATCH: seuls les champs envoyés sont appliqués ; day peut être null (retour au dossier)."""

    model_config = ConfigDict(extra="ignore")

    nom: Optional[str] = None
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    properties: Optional[dict] = None
    favorite_id: Optional[int] = None
    day: Optional[int] = None
    position: Optional[int] = None
    travel_mode: Optional[str] = None


class FavoriteCreate(BaseModel):
    nom: str
    category: str = "Lieu"
    continent: Optional[str] = None
    latitude: float
    longitude: float
    source_url: Optional[str] = None
    properties: dict = Field(default_factory=dict)


class FavoriteRead(BaseModel):
    id: int
    nom: str
    category: str
    continent: Optional[str] = None
    latitude: float
    longitude: float
    source_url: Optional[str] = None

    class Config:
        from_attributes = True


class PlanFromFavorite(BaseModel):
    favorite_id: int
    day: int | None = None
    position: int | None = None
    travel_mode: str | None = None