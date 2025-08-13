from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str



class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    username: str | None = None
    is_active: bool

    class Config:
        from_attributes = True


class UserUpdateRole(BaseModel):
    role: str


class UserUpdateActive(BaseModel):
    is_active: bool
