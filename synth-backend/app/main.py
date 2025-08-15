from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
from app.db.database import Base, async_engine
from app.routers import generation, generation_v2, auth, data , notification, optimization, stats, user, dataset # Routers async convertis
from app.routers import upload_async , admin

from app.core.middleware import (
    LoggingMiddleware,
    PerformanceMonitoringMiddleware,
    SecurityHeadersMiddleware,
    RequestSizeLimitMiddleware
)
from app.core.config import settings

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Fonction pour créer les tables de manière asynchrone
async def create_tables():
    """Créer les tables de base de données de manière asynchrone"""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Gestionnaire de cycle de vie pour l'application
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestionnaire de cycle de vie de l'application"""
    # Démarrage
    await create_tables()
    logger.info("Tables de base de données créées avec succès")
    yield
    # Arrêt (rien à faire pour l'instant)

# Application FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Plateforme de génération de données synthétiques avec IA",
    debug=settings.DEBUG,
    lifespan=lifespan
)

# Middlewares
app.add_middleware(RequestSizeLimitMiddleware, max_request_size=settings.MAX_FILE_SIZE_MB * 1024 * 1024)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(PerformanceMonitoringMiddleware, slow_request_threshold=2.0)
app.add_middleware(LoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "exp://192.168.11.144:8081",
        "http://localhost:8081",
        "http://192.168.11.144:8081",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Routers - convertis en async
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(notification.router)
app.include_router(generation.router)
app.include_router(generation_v2.router) 
app.include_router(data.router)          
app.include_router(upload_async.router)  # Router datasets upload
app.include_router(dataset.router)       # Router synthetic datasets
app.include_router(optimization.router)  # Router optimization activé
app.include_router(stats.router)         # Router stats activé
app.include_router(admin.router)         # Router admin activé

# logger.info(f"Application {settings.APP_NAME} v{settings.APP_VERSION} started")
