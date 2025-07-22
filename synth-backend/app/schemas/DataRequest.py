from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
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
    parameters: Optional[RequestParametersOut] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)

class DataRequestWithParams(BaseModel):
    request: DataRequestCreate
    params: RequestParametersOut    

    class Config:
        orm_mode = True
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }