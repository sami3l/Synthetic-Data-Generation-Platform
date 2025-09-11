from sqlalchemy import Column, ForeignKey, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  
    username = Column(String, unique=True, index=True, nullable=True) 
    is_active = Column(Boolean, default=True)
    push_token = Column(String, nullable=True)  
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    synthetic_datasets = relationship(
        "SyntheticDataset", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    data_requests = relationship(
        "DataRequest", 
        back_populates="user", 
        foreign_keys="DataRequest.user_id",
        cascade="all, delete-orphan"
    )
    uploaded_datasets = relationship("UploadedDataset", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    
    admin_logs = relationship("AdminActionLog", foreign_keys="AdminActionLog.admin_id", back_populates="admin")
    target_logs = relationship("AdminActionLog", foreign_keys="AdminActionLog.target_user_id", back_populates="target_user")
    

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
