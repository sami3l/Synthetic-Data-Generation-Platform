from sqlalchemy import Boolean, Column, Integer, Float, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

class RequestParameters(Base):
    __tablename__ = "request_parameters"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    request_id = Column(
        Integer, 
        ForeignKey("data_requests.id", ondelete="CASCADE"),
        nullable=False
    )
    model_type = Column(String, default="ctgan")
    sample_size = Column(Integer, default=1000)  # Nouveau champ pour la taille d'échantillon
    mode = Column(String, default="simple")  # Nouveau champ pour le mode (simple/optimization)
    
    # Paramètres de base
    epochs = Column(Integer, default=300)
    batch_size = Column(Integer, default=500)
    learning_rate = Column(Float, default=0.0002)
    
    # Paramètres spécifiques CTGAN
    generator_lr = Column(Float, nullable=True)  # Learning rate du générateur
    discriminator_lr = Column(Float, nullable=True)  # Learning rate du discriminateur

    # Champs pour l'optimisation
    optimization_enabled = Column(Boolean, default=False)
    optimization_method = Column(String, default="grid")  # Renommé pour correspondre à l'API v2
    optimization_n_trials = Column(Integer, default=5)
    hyperparameters = Column(JSON, default=list)  # Liste des hyperparamètres à optimiser

    data_request = relationship(
        "DataRequest",
        back_populates="request_parameters",
        passive_deletes=True
    )

