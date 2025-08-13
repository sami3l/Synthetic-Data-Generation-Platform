from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, JSON, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from datetime import datetime


class UploadedDataset(Base):
    __tablename__ = "uploaded_datasets"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Informations du fichier
    original_filename = Column(String, nullable=False)
    unique_filename = Column(String, nullable=False, unique=True)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # en bytes
    
    # Métadonnées du dataset
    n_rows = Column(Integer, nullable=False)
    n_columns = Column(Integer, nullable=False)
    columns = Column(JSON, nullable=False)  # Liste des noms de colonnes
    column_info = Column(JSON, nullable=False)  # Informations détaillées des colonnes
    
    # Statistiques
    memory_usage = Column(Integer)
    has_nulls = Column(Boolean, default=False)
    total_nulls = Column(Integer, default=0)
    
    # Statut
    is_valid = Column(Boolean, default=True)
    validation_errors = Column(JSON, default=list)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relations
    user = relationship("User", back_populates="uploaded_datasets")
    # data_requests = relationship("DataRequest", back_populates="uploaded_dataset")  # Temporairement commenté

