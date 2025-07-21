from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# ⬇️ Explicitly import your models here ⬇️
from app.models.user import User
from app.models.UserProfile import UserProfile
from app.models.DataRequest import DataRequest
from app.models.RequestParameters import RequestParameters
from app.models.SyntheticDataset import SyntheticDataset
from app.models.Notification import Notification
from app.models.tvae_model import TVAEModel
from app.models.ctgan_model import CTGANModel
# Add other models as needed

def get_db() -> Session:  # type: ignore
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
