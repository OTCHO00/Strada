from sqlmodel import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base


POSTGRES_USER = "postgres"
POSTGRES_PASSWORD = "fares1209"
POSTGRES_HOST = "localhost"
POSTGRES_PORT = "5432" 
POSTGRES_DB = "BACKEND_TRAINING"

DATABASE_URL = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
    f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

engine = create_engine(DATABASE_URL)