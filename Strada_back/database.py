import os
from sqlmodel import create_engine


def _get_database_url() -> str:
    """
    Uses DATABASE_URL if set, otherwise falls back to a local SQLite db.
    """
    return os.getenv("DATABASE_URL", "sqlite:///./strada.db")


engine = create_engine(_get_database_url())