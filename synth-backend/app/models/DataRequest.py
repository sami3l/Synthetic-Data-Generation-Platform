from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class DataRequest(Base):
    __tablename__ = "data_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")  # pending, approved, completed, etc.
    created_at = Column(DateTime, default=datetime.utcnow)

    parameters = relationship("RequestParameters", back_populates="data_request", uselist=False)
    synthetic_dataset = relationship("SyntheticDataset", back_populates="data_request", uselist=False)
    user = relationship("User", back_populates="data_requests")
