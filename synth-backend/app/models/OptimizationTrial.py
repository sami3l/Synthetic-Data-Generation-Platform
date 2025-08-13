from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class OptimizationTrial(Base):
    __tablename__ = "optimization_trials"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("optimization_configs.id"), nullable=False)
    trial_number = Column(Integer, nullable=False)
    
    # Paramètres testés
    parameters = Column(JSON, nullable=False)
    
    # Résultats
    quality_score = Column(Float)
    training_time = Column(Float)  # en secondes
    memory_usage = Column(Float)   # en MB
    
    # Métadonnées
    status = Column(String, default="pending")  # pending, running, completed, failed
    error_message = Column(String)
    
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relations
    config = relationship("OptimizationConfig", back_populates="optimization_trials")
    optimization_results = relationship("OptimizationResult", back_populates="trial")

    def __repr__(self):
        return f"<OptimizationTrial(id={self.id}, trial_number={self.trial_number}, status={self.status})>"