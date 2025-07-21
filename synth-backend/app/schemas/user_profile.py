# app/schemas/user_profile.py
from pydantic import BaseModel
from datetime import datetime

class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str | None = None
    organization: str | None = None
    usage_purpose: str | None = None
    # Optional fields for timestamps
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        orm_mode = True


# Schema for update
class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    organization: str | None = None
    usage_purpose: str | None = None


# Schema for user profile creation
class UserProfileCreate(BaseModel):
    user_id: int
    full_name: str | None = None
    organization: str | None = None
    usage_purpose: str | None = None

    class Config:
        orm_mode = True
