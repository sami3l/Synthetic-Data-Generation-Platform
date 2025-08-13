from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.db.database import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"

    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    full_name = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    usage_purpose = Column(String, nullable=True)
    role = Column(String, nullable=False, default="user")  # Nouveau champ role
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    

    # Relation avec User
    user = relationship("User", back_populates="profile")

    def __repr__(self):
        return f"<UserProfile(id={self.id}, user_id={self.user_id}, full_name={self.full_name})>"
