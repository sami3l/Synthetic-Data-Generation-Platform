from pydantic import BaseModel
from typing import Optional

class OptimizationConfig(BaseModel):
    enabled: bool = False
    search_type: Optional[str] = "grid"  # "grid" ou "random"
    n_random_trials: Optional[int] = 5  # pour la recherche aléatoire

class RequestParametersCreate(BaseModel):
    model_type: str
    epochs: int = 300
    batch_size: int = 500
    learning_rate: float = 0.001
    optimization: OptimizationConfig = OptimizationConfig()