from sqlalchemy import Boolean, Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class RequestParameters(Base):
    __tablename__ = "request_parameters"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("data_requests.id"), nullable=False)
    model_type = Column(String, default="ctgan")  # ctgan or tvae
    epochs = Column(Integer, default=300)
    batch_size = Column(Integer, default=500)
    learning_rate = Column(Float, default=2e-4)
    optimization_enabled = Column(Boolean, default=False)
    optimization_search_type = Column(String, default="grid")
    optimization_n_trials = Column(Integer, default=5)

    data_request = relationship("DataRequest", back_populates="parameters")
