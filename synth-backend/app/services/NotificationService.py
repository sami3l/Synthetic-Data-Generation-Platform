from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.Notification import Notification
from app.models.user import User
from app.services.push_notification_service import PushNotificationService
import asyncio
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def send_notification(
        db: Session,
        user_id: int,
        message: str,
        title: str = "Notification",
        send_push: bool = True
    ):
        """Envoie une notification générique à l'utilisateur."""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            timestamp=datetime.utcnow()
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        # Envoyer la notification push de manière asynchrone
        if send_push:
            try:
                user = db.query(User).filter(User.id == user_id).first()
                if user and user.push_token:
                    # Lancer la tâche asynchrone sans bloquer
                    asyncio.create_task(
                        PushNotificationService.send_push_notification(
                            user, title, message
                        )
                    )
            except Exception as e:
                logger.error(f"Erreur lors de l'envoi de la notification push: {e}")
        
        return notification

    @staticmethod
    def create_generation_success_notification(
        db: Session,
        user_id: int,
        request_id: int,
        quality_score: float
    ):
        """Crée une notification pour une génération réussie."""
        title = "Génération terminée"
        message = f"Votre requête #{request_id} a été traitée avec succès. Score de qualité: {quality_score:.2f}"
        return NotificationService.send_notification(
            db=db,
            user_id=user_id,
            message=message,
            title=title
        )
