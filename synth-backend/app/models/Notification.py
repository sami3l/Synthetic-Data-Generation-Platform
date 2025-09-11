from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Boolean ,Integer, String, Text, func
from app.db.database import Base
from sqlalchemy.orm import relationship


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relation
    user = relationship("User", back_populates="notifications")