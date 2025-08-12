from sqlalchemy import JSON, Column, Float, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class OptimizationResult(Base):
    __tablename__ = "optimization_results"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("data_requests.id"), nullable=False)
    trial_id = Column(Integer, ForeignKey("optimization_trials.id"), nullable=True)  # Peut être null pour les résultats globaux
    
    # Résultats de l'optimisation
    best_parameters = Column(JSON, nullable=False)
    quality_score = Column(Float, nullable=False)  # Renommé de best_quality_score pour cohérence
    
    # Métadonnées
    status = Column(String, default="pending")  # pending, completed, failed
    error_message = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    request = relationship("DataRequest", back_populates="optimization_results")
    trial = relationship("OptimizationTrial", back_populates="optimization_results")

    def __repr__(self):
        return f"<OptimizationResult(id={self.id}, request_id={self.request_id}, quality_score={self.quality_score})>"