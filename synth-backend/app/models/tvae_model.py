from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class TVAEModel(Base):
    __tablename__ = "tvae_models"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, nullable=False)
    model_params = Column(JSON, nullable=True)
    trained_at = Column(DateTime, default=datetime.utcnow)

    
    synthetic_dataset = relationship("SyntheticDataset", back_populates="tvae_model")
