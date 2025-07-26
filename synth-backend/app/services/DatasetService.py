from sqlalchemy.orm import Session
from app.models.SyntheticDataset import SyntheticDataset
from datetime import datetime


class DatasetService:

    @staticmethod
    def get_dataset_by_request_id(db: Session, request_id: int):
        return db.query(SyntheticDataset).filter_by(request_id=request_id).first()

    @staticmethod
    def save_generated_data(
        db: Session, 
        request_id: int, 
        file_path: str,
        user_id: int
    ):
        """Sauvegarde les données synthétiques générées"""
        synthetic_dataset = SyntheticDataset(
            request_id=request_id,
            file_path=file_path,
            user_id=user_id,  # Ajout de l'ID utilisateur
            created_at=datetime.now()
        )
        db.add(synthetic_dataset)
        db.commit()
        db.refresh(synthetic_dataset)
        return synthetic_dataset