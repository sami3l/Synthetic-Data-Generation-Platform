from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.dependencies.auth import get_current_user

from app.schemas.user import UserCreate, UserLogin
from app.auth import jwt
from passlib.context import CryptContext
from app.dependencies.roles import require_role


router = APIRouter(prefix="/admin", tags=["Administration"])

@router.get("/dashboard")
def admin_dashboard(current_user: User = Depends(require_role("admin"))):
    return {"message": f"Welcome, {current_user.username}! You are an admin."}
