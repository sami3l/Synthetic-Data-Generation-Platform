from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum
from app.db.database import Base

class RequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"        
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"        

class DataRequest(Base):
    __tablename__ = "data_requests"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_dataset_id = Column(Integer, ForeignKey("uploaded_datasets.id"), nullable=True)
    request_name = Column(String, nullable=False)
    dataset_name = Column(String, nullable=False)
    status = Column(String, default=RequestStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Relations existantes
    request_parameters = relationship(
        "RequestParameters",
        back_populates="data_request",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    synthetic_datasets = relationship(  
        "SyntheticDataset", 
        back_populates="data_request",
        cascade="all, delete-orphan"
    )
    
    optimization_results = relationship(
        "OptimizationResult", 
        back_populates="request"
    )
    
    user = relationship("User", back_populates="data_requests", foreign_keys=[user_id])
    
    # ✅ NOUVELLE RELATION POUR L'APPROBATEUR
    approver = relationship("User", foreign_keys=[approved_by])
    
    uploaded_dataset = relationship("UploadedDataset", back_populates="data_requests")
    
    # Nouvelle relation pour l'optimisation avancée
    optimization_config = relationship(
        "OptimizationConfig",
        back_populates="data_request",
        uselist=False,
        cascade="all, delete-orphan"
    )