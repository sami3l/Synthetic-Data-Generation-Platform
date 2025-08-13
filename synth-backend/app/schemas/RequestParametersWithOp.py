from pydantic import BaseModel
from typing import Optional

class OptimizationConfig(BaseModel):
    enabled: bool = False
    search_type: Optional[str] = "grid"  # "grid" ou "random"
    n_trials: Optional[int] = 5  # Nombre d'essais pour la recherche aléatoire

class RequestParametersCreate(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    model_type: str
    epochs: Optional[int] = 300
    batch_size: Optional[int] = 500
    learning_rate: Optional[float] = 0.001
    optimization: OptimizationConfig = OptimizationConfig()