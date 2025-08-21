from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.RequestParameters import RequestParametersBase, RequestParametersOut

class DataRequestBase(BaseModel):
    request_name: str
    dataset_name: str
    uploaded_dataset_id: Optional[int] = None

class DataRequestCreate(DataRequestBase):
    pass

class DataRequestOut(DataRequestBase):
    id: int
    user_id: int
    status: str = "pending"
    created_at: datetime
    updated_at: datetime
    # ✅ NOUVEAUX CHAMPS POUR APPROBATION
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    request_parameters: Optional[RequestParametersOut] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class DataRequestWithParams(BaseModel):
    """
    Input payload:
      {
        "request": { ... },
        "params":  { ... }
      }
    """
    request: DataRequestBase
    params: RequestParametersBase

# ✅ NOUVEAUX SCHEMAS POUR APPROBATION
class RequestApprovalAction(BaseModel):
    rejection_reason: Optional[str] = None

