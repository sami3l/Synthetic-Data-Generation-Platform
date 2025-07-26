from typing import Optional
from pydantic import BaseModel


class RequestParametersBase(BaseModel):
    model_type: str = "ctgan"
    epochs: int = 300
    batch_size: int = 500
    learning_rate: float = 2e-4
    optimization_enabled: bool = False
    optimization_search_type: str = "grid"
    optimization_n_trials: int = 5

class RequestParametersCreate(RequestParametersBase):
    request_id: int

class RequestParametersOut(RequestParametersBase):
    id: int
    request_id: int

    class Config:
        orm_mode = True
