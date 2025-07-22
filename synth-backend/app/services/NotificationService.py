from sqlalchemy.orm import Session
from app.models.Notification import Notification

class NotificationService:
    @staticmethod
    def create_generation_success_notification(
        db: Session,
        user_id: int,
        request_id: int,
        quality_score: float
    ):
        """Crée une notification pour une génération réussie"""
        notification = Notification(
            user_id=user_id,
            title="Génération de données réussie",
            message=f"Votre requête #{request_id} a été traitée avec succès. Score de qualité: {quality_score:.2f}"
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification