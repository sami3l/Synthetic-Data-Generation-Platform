import datetime
from pydantic import BaseModel


class NotificationBase(BaseModel):
    title: str
    message: str

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationOut(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    timestamp: datetime.datetime

    class Config:
        orm_mode = True
