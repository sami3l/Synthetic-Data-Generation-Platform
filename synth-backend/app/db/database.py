from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Configuration de la base de données synchrone (pour les migrations et opérations de base)
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300
)

# Configuration de la base de données asynchrone (pour l'application)
async_engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300
)

# Session synchrone (pour les migrations et certaines opérations)
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# Session asynchrone (pour l'application principale)
AsyncSessionLocal = sessionmaker(
    async_engine, 
    expire_on_commit=False, 
    class_=AsyncSession
)

Base = declarative_base()

def get_db():
    """Générateur de session de base de données synchrone"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_async_db():
    """Générateur de session de base de données asynchrone"""
    async with AsyncSessionLocal() as session:
        yield session