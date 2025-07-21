from fastapi import Depends, HTTPException
from app.dependencies.auth import get_current_user
from app.models.user import User

def require_role(role: str):
    def role_checker(user: User = Depends(get_current_user)):
        if user.role != role:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

    