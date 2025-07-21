from typing import Optional
from pydantic import BaseModel


class RequestParametersBase(BaseModel):
    model_type: str
    epochs: Optional[int]
    batch_size: Optional[int]
    learning_rate: Optional[float]

class RequestParametersCreate(RequestParametersBase):
    request_id: int

class RequestParametersOut(RequestParametersBase):
    id: int
    request_id: int

    class Config:
        orm_mode = True
