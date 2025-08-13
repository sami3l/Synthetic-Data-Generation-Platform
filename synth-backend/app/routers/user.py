from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_async_db
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register-push-token")
async def register_push_token(
    token_data: dict,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """Enregistre le token de notification push pour l'utilisateur"""
    try:
        current_user.push_token = token_data.get("push_token")
        await db.commit()
        await db.refresh(current_user)
        return {"status": "success", "message": "Token de notification enregistré"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Erreur lors de l'enregistrement du token")
