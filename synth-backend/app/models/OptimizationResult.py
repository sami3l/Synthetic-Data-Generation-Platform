from sqlalchemy import Column, Integer, Float, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class OptimizationResult(Base):
    __tablename__ = "optimization_results"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("data_requests.id"), nullable=False)
    best_parameters = Column(JSON, nullable=False)  # Stocke les meilleurs paramètres sous forme JSON
    quality_score = Column(Float, nullable=False)  # Score de qualité associé aux meilleurs paramètres
    created_at = Column(DateTime, default=datetime.utcnow)  # Date de création de l'enregistrement

    request = relationship("DataRequest", back_populates="optimization_results")