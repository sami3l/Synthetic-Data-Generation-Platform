from pydantic import BaseModel
from typing import Optional, List

class RequestParametersBase(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    model_type: str = "ctgan"
    epochs: int = 300
    batch_size: int = 500
    learning_rate: float = 0.0002
    optimization_enabled: bool = False
    optimization_method: Optional[str] = "grid"
    optimization_n_trials: Optional[int] = 5
    hyperparameters: Optional[List[str]] = []

class RequestParametersCreate(RequestParametersBase):
    request_id: int

class RequestParametersOut(RequestParametersBase):
    id: int
    request_id: int

    class Config:
        from_attributes = True 