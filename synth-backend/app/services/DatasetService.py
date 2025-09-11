from sqlalchemy.orm import Session
from app.models.SyntheticDataset import SyntheticDataset
from datetime import datetime
from pathlib import Path
import os


class DatasetService:

    @staticmethod
    def get_dataset_by_request_id(db: Session, request_id: int):
        return db.query(SyntheticDataset).filter_by(request_id=request_id).first()

    @staticmethod
    def save_generated_data(
        db: Session, 
        request_id: int, 
        file_path: str,
        user_id: int,
        supabase_path: str = None,
        download_url: str = None
    ):
        """Sauvegarde les données synthétiques générées avec métadonnées Supabase"""
        # Extraire le nom du fichier et la taille
        file_path_obj = Path(file_path)
        file_name = file_path_obj.name
        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
        
        synthetic_dataset = SyntheticDataset(
            request_id=request_id,
            storage_path=supabase_path or file_path,  # Priorité au chemin Supabase
            file_name=file_name,
            file_size=file_size,
            file_format="csv",
            user_id=user_id,
            download_url=download_url,
            storage_bucket="synthetic-datasets" if supabase_path else None,
            created_at=datetime.now()
        )
        db.add(synthetic_dataset)
        db.commit()
        db.refresh(synthetic_dataset)
        return synthetic_dataset