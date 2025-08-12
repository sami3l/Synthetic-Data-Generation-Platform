from pydantic import BaseModel
from datetime import datetime

class AdminActionLogResponse(BaseModel):
    id: int
    admin_id: int
    action: str
    target_user_id: int | None = None
    details: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
