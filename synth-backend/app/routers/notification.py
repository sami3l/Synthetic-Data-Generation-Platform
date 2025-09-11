from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.schemas.Notification import NotificationOut
from app.models.Notification import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[NotificationOut])
async def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère toutes les notifications de l'utilisateur"""
    notifications = db.query(Notification)\
        .filter(Notification.user_id == current_user.id)\
        .order_by(Notification.timestamp.desc())\
        .all()
    return notifications

@router.post("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marque une notification comme lue"""
    notification = db.query(Notification)\
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    
    notification.is_read = True
    db.commit()
    return {"status": "success"}

@router.post("/read-all")
async def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marque toutes les notifications comme lues"""
    notifications = db.query(Notification)\
        .filter(Notification.user_id == current_user.id)\
        .all()
    
    for notification in notifications:
        notification.is_read = True
    db.commit()
    return {"status": "success"}