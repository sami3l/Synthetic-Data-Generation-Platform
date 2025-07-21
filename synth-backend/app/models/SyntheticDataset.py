from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class SyntheticDataset(Base):
    __tablename__ = "synthetic_datasets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ctgan_model_id = Column(Integer, ForeignKey("ctgan_models.id"), nullable=True)
    tvae_model_id = Column(Integer, ForeignKey("tvae_models.id"), nullable=True)
    request_id = Column(Integer, ForeignKey("data_requests.id"), nullable=False)
    file_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    data_request = relationship("DataRequest", back_populates="synthetic_dataset")
    user = relationship("User", back_populates="synthetic_datasets")
    ctgan_model = relationship("CTGANModel", back_populates="synthetic_dataset", uselist=False)
    tvae_model = relationship("TVAEModel", back_populates="synthetic_dataset", uselist=False)
