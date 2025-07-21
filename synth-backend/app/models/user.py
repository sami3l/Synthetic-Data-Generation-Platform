from sqlalchemy import Column, ForeignKey, Integer, String, Text
from app.db.database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # 'admin' or 'user'
    username = Column(String, unique=True, index=True, nullable=True) 

    profile = relationship("UserProfile", back_populates="user", uselist=False)
    synthetic_datasets = relationship("SyntheticDataset", back_populates="user")
    data_requests = relationship("DataRequest", back_populates="user")
