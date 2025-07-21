from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from app.schemas.RequestParameters import RequestParametersOut

class DataRequestBase(BaseModel):
    request_name: str
    dataset_name: str

class DataRequestCreate(DataRequestBase):
    pass

class DataRequestOut(DataRequestBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    parameters: Optional[List[RequestParametersOut]] 

    class Config:
        orm_mode = True
