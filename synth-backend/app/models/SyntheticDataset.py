from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class SyntheticDataset(Base):
    __tablename__ = "synthetic_datasets"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    request_id = Column(Integer, ForeignKey("data_requests.id"), nullable=False)
    
    # Model references
    ctgan_model_id = Column(Integer, ForeignKey("ctgan_models.id"), nullable=True)
    tvae_model_id = Column(Integer, ForeignKey("tvae_models.id"), nullable=True)
    
    # Supabase storage fields (replacing file_path)
    storage_bucket = Column(String, nullable=True)
    storage_path = Column(String, nullable=True)  # e.g. "user_123/request_456/dataset.csv"
    file_name = Column(String, nullable=True)
    file_size = Column(Integer)  # in bytes
    file_format = Column(String, default="csv")
    
    # Access information
    download_url = Column(String)
    url_expires_at = Column(DateTime)
    download_token = Column(String, nullable=True)  # Token temporaire pour téléchargement sans auth
    token_expires_at = Column(DateTime, nullable=True)  # Expiration du token
    
    # Generation metadata
    quality_score = Column(Float)
    row_count = Column(Integer)
    column_count = Column(Integer)
    parameters = Column(JSON)  # Stores generation parameters
    stats = Column(JSON)  # Statistical metadata
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Utiliser des chaînes de caractères avec le module complet pour éviter les problèmes d'importation
    user = relationship("User", back_populates="synthetic_datasets")
    ctgan_model = relationship("app.models.ctgan_model.CTGANModel", back_populates="synthetic_dataset")
    tvae_model = relationship("app.models.tvae_model.TVAEModel", back_populates="synthetic_dataset")
    data_request = relationship("DataRequest", back_populates="synthetic_datasets")

    def __repr__(self):
        return f"<SyntheticDataset(id={self.id}, user_id={self.user_id}, file={self.file_name})>"