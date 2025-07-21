from sqlalchemy.orm import Session
from app.models.SyntheticDataset import SyntheticDataset

class DatasetService:

    @staticmethod
    def get_dataset_by_request_id(db: Session, request_id: int):
        return db.query(SyntheticDataset).filter_by(request_id=request_id).first()

    @staticmethod
    def save_generated_data(db: Session, request_id: int, file_path: str):
        dataset = SyntheticDataset(request_id=request_id, file_path=file_path)
        db.add(dataset)
        db.commit()
        return dataset