from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class OptimizationConfig(Base):
    __tablename__ = "optimization_configs"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("data_requests.id"), nullable=False)
    
    # Type d'optimisation
    optimization_type = Column(String, nullable=False)  # "bayesian", "grid", "random"
    
    # Configuration générale
    max_evaluations = Column(Integer, default=50)
    timeout_minutes = Column(Integer, default=60)
    
    # Paramètres spécifiques
    search_space = Column(JSON)  # Définition de l'espace de recherche
    acquisition_function = Column(String, default="expected_improvement")  # Pour bayésien
    
    # État et résultats
    status = Column(String, default="pending")  # pending, running, completed, failed
    best_score = Column(Float)
    total_evaluations = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    data_request = relationship("DataRequest", back_populates="optimization_config")
    optimization_trials = relationship("OptimizationTrial", back_populates="config", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<OptimizationConfig(id={self.id}, request_id={self.request_id}, type={self.optimization_type})>"