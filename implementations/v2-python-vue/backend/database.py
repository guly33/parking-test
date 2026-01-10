from sqlalchemy import create_engine
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db/parking")

engine = create_engine(DATABASE_URL)

def get_db_connection():
    return engine.connect()
