from sqlalchemy import Boolean, Column, Integer, Float, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class RequestParameters(Base):
    __tablename__ = "request_parameters"

    id = Column(Integer, primary_key=True, index=True)  # Assurez-vous que autoincrement=True est défini
    request_id = Column(Integer, ForeignKey("data_requests.id"), nullable=False)
    model_type = Column(String, default="ctgan")
    epochs = Column(Integer, default=300)
    batch_size = Column(Integer, default=500)
    learning_rate = Column(Float, default=0.001)

    # Champs pour l'optimisation
    optimization_enabled = Column(Boolean, default=False)
    optimization_search_type = Column(String, default="grid")
    optimization_n_trials = Column(Integer, default=5)

    # Relation avec DataRequest
    data_request = relationship("DataRequest", back_populates="parameters")