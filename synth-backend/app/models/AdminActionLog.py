from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class AdminActionLog(Base):
    __tablename__ = "admin_action_logs"
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    admin = relationship("User", foreign_keys=[admin_id], back_populates="admin_logs")
    target_user = relationship("User", foreign_keys=[target_user_id], back_populates="target_logs")

    def __repr__(self):
        return f"<AdminActionLog(id={self.id}, admin_id={self.admin_id}, action={self.action})>"
