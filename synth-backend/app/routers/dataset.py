# app/routers/datasets.py
import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.services.SupabaseStorageService import SupabaseStorageService
from app.models import SyntheticDataset , User
from app.db.database import get_db
from app.schemas.datasets import DatasetCreate, DatasetOut
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/synthetic", tags=["Synthetic Datasets"])

@router.post("", response_model=DatasetOut)
async def create_dataset(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    storage: SupabaseStorageService = Depends(SupabaseStorageService),
    current_user: User = Depends(get_current_user)
):
    """Endpoint to handle dataset creation"""
    try:
        # 1. Generate your synthetic data (implement your logic)
        local_file_path = "/tmp/generated_dataset.csv"  # Replace with actual path
        
        # 2. Upload to Supabase
        upload_result = await storage.upload_file(
            file_path=local_file_path,
            user_id=current_user.id,
            
            metadata={
                "rows": 1000,
                "columns": ["feature1", "feature2"],
                "quality_score": 0.95
            }
        )
        
        # 3. Generate download URL
        download_url = await storage.get_download_url(upload_result["storage_path"])
        
        # 4. Save to database
        dataset = SyntheticDataset(
            user_id=current_user.id,
           
            file_name=upload_result["file_name"],
            storage_path=upload_result["storage_path"],
            bucket_name=upload_result["bucket"],
            file_size=upload_result["size"],
            download_url=download_url,
            url_expires_at=datetime.utcnow() + timedelta(seconds=3600),
            metadata=upload_result["metadata"]
        )
        
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        
        # 5. Cleanup local file in background
        background_tasks.add_task(lambda: os.unlink(local_file_path))
        
        return dataset
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{dataset_id}/download")
async def download_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    storage: SupabaseStorageService = Depends(SupabaseStorageService),
    current_user: User = Depends(get_current_user)
):
    """Redirect to signed download URL"""
    dataset = db.query(SyntheticDataset).filter(
        SyntheticDataset.id == dataset_id,
        SyntheticDataset.user_id == current_user.id
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Refresh expired URLs
    if not dataset.download_url or dataset.url_expires_at < datetime.utcnow():
        # Add 'await' here
        dataset.download_url = await storage.get_download_url(dataset.storage_path)
        dataset.url_expires_at = datetime.utcnow() + timedelta(seconds=3600)
        db.commit()

    # 307 preserves method; 302 also OK for simple GETs
    return RedirectResponse(url=dataset.download_url, status_code=307)

