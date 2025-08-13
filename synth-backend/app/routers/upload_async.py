from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.database import get_async_db
from app.models.UploadedDataset import UploadedDataset
from app.models.user import User
from app.dependencies.auth import get_current_user
from pydantic import BaseModel
import logging
import pandas as pd
import io
import uuid
import os
from typing import Optional

router = APIRouter(prefix="/datasets", tags=["Datasets Upload"])

# Schema pour la mise à jour des datasets
class DatasetUpdateRequest(BaseModel):
    original_filename: Optional[str] = None
    
logger = logging.getLogger(__name__)

@router.get("/")
async def get_datasets(
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupérer la liste des datasets uploadés par l'utilisateur
    """
    try:
        logger.info(f"Getting datasets for user {current_user.id}")
        
        result = await db.execute(
            select(UploadedDataset)
            .where(UploadedDataset.user_id == current_user.id)
            .order_by(UploadedDataset.created_at.desc())
        )
        datasets = result.scalars().all()
        
        logger.info(f"Found {len(datasets)} datasets for user {current_user.id}")
        
        # Retourner un format cohérent
        response = {
            "datasets": [
                {
                    "id": dataset.id,
                    "original_filename": dataset.original_filename,
                    "file_size": dataset.file_size,
                    "n_rows": dataset.n_rows,
                    "n_columns": dataset.n_columns,
                    "created_at": dataset.created_at.isoformat() if dataset.created_at else None,
                    "is_valid": dataset.is_valid
                }
                for dataset in datasets
            ]
        }
        
        logger.info(f"Returning response with {len(response['datasets'])} datasets")
        return response
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des datasets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des datasets: {str(e)}")

logger = logging.getLogger("upload_async")

@router.post("/upload", response_model=dict)
async def upload_dataset(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_db),
    user: User = Depends(get_current_user)
):
    """
    Upload un fichier dataset (CSV, Excel, etc.)
    """
    try:
        logger.info(f"Upload dataset attempt by user {user.id}: {file.filename}")
        
        # Vérifier si un dataset avec ce nom existe déjà
        if file.filename:
            result = await db.execute(
                select(UploadedDataset)
                .where(
                    UploadedDataset.user_id == user.id,
                    UploadedDataset.original_filename == file.filename
                )
            )
            existing_dataset = result.scalar_one_or_none()
            
            if existing_dataset:
                raise HTTPException(
                    status_code=409,
                    detail=f"Un dataset avec le nom '{file.filename}' existe déjà. Veuillez choisir un autre nom ou supprimer l'ancien dataset."
                )
        
        # Vérifier l'extension du fichier (plus fiable que content_type)
        filename = file.filename.lower() if file.filename else ""
        allowed_extensions = ['.csv', '.xls', '.xlsx']
        
        if not any(filename.endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400,
                detail=f"Extension de fichier non supportée. Extensions acceptées: {', '.join(allowed_extensions)}"
            )
        
        # Lire le contenu du fichier
        content = await file.read()
        file_size = len(content)
        
        # Vérifier la taille (50MB max)
        max_size = 50 * 1024 * 1024  # 50MB
        if file_size > max_size:
            raise HTTPException(
                status_code=400,
                detail="Le fichier est trop volumineux (maximum 50MB)"
            )
        
        # Analyser le fichier pour obtenir des métadonnées
        try:
            if filename.endswith('.csv'):
                df = pd.read_csv(io.StringIO(content.decode('utf-8')))
            elif filename.endswith('.xlsx'):
                df = pd.read_excel(io.BytesIO(content))
            elif filename.endswith('.xls'):
                df = pd.read_excel(io.BytesIO(content))
            
            n_rows, n_columns = df.shape
            columns = list(df.columns)
            
        except Exception as parse_error:
            logger.error(f"Erreur lors de l'analyse du fichier: {parse_error}")
            raise HTTPException(
                status_code=400,
                detail="Impossible de lire le fichier. Vérifiez le format."
            )
        
        # Créer des informations détaillées sur les colonnes
        column_info = {}
        for col in df.columns:
            column_info[col] = {
                'dtype': str(df[col].dtype),
                'null_count': int(df[col].isnull().sum()),
                'unique_count': int(df[col].nunique())
            }
        
        # Générer un nom de fichier unique
        unique_filename = f"dataset_{user.id}_{uuid.uuid4().hex[:8]}_{file.filename}"
        
        # Créer l'enregistrement en base de données
        uploaded_dataset = UploadedDataset(
            user_id=user.id,
            original_filename=file.filename,
            unique_filename=unique_filename,
            file_path=f"/uploads/{user.id}/{unique_filename}",
            file_size=file_size,
            n_rows=n_rows,
            n_columns=n_columns,
            columns=columns,
            column_info=column_info,
            has_nulls=df.isnull().any().any(),
            total_nulls=int(df.isnull().sum().sum()),
            is_valid=True
        )
        
        db.add(uploaded_dataset)
        await db.commit()
        await db.refresh(uploaded_dataset)
        
        logger.info(f"Dataset uploaded successfully: {uploaded_dataset.id}")
        
        return {
            "message": "Fichier uploadé avec succès",
            "file_id": uploaded_dataset.id,
            "filename": uploaded_dataset.unique_filename,
            "original_filename": uploaded_dataset.original_filename,
            "file_size": file_size,
            "n_rows": n_rows,
            "n_columns": n_columns,
            "columns": columns,
            "column_info": column_info,
            "has_nulls": uploaded_dataset.has_nulls,
            "total_nulls": uploaded_dataset.total_nulls
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload: {str(e)}")

@router.get("/check-filename/{filename}")
async def check_filename_exists(
    filename: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Vérifier si un nom de fichier existe déjà pour cet utilisateur
    """
    try:
        result = await db.execute(
            select(UploadedDataset)
            .where(
                UploadedDataset.user_id == current_user.id,
                UploadedDataset.original_filename == filename
            )
        )
        existing_dataset = result.scalar_one_or_none()
        
        return {
            "exists": existing_dataset is not None,
            "dataset_id": existing_dataset.id if existing_dataset else None,
            "message": f"Le fichier '{filename}' existe déjà" if existing_dataset else f"Le fichier '{filename}' peut être uploadé"
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la vérification du nom de fichier: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification")

@router.put("/{dataset_id}")
async def update_dataset(
    dataset_id: int,
    update_data: DatasetUpdateRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Modifier les métadonnées d'un dataset
    """
    try:
        # Vérifier que le dataset appartient à l'utilisateur
        result = await db.execute(
            select(UploadedDataset)
            .where(
                UploadedDataset.id == dataset_id,
                UploadedDataset.user_id == current_user.id
            )
        )
        dataset = result.scalar_one_or_none()
        
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset non trouvé ou non autorisé")
        
        # Vérifier si le nouveau nom existe déjà (si fourni)
        if update_data.original_filename and update_data.original_filename != dataset.original_filename:
            result = await db.execute(
                select(UploadedDataset)
                .where(
                    UploadedDataset.user_id == current_user.id,
                    UploadedDataset.original_filename == update_data.original_filename,
                    UploadedDataset.id != dataset_id
                )
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                raise HTTPException(status_code=400, detail=f"Un dataset avec le nom '{update_data.original_filename}' existe déjà")
        
        # Mettre à jour les champs modifiables
        if update_data.original_filename:
            dataset.original_filename = update_data.original_filename
        
        await db.commit()
        await db.refresh(dataset)
        
        return {
            "message": "Dataset mis à jour avec succès",
            "dataset": {
                "id": dataset.id,
                "original_filename": dataset.original_filename,
                "file_size": dataset.file_size,
                "n_rows": dataset.n_rows,
                "n_columns": dataset.n_columns,
                "created_at": dataset.created_at.isoformat() if dataset.created_at else None,
                "is_valid": dataset.is_valid
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour du dataset: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Erreur lors de la mise à jour")

@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Supprimer un dataset et son fichier associé
    """
    try:
        # Vérifier que le dataset appartient à l'utilisateur
        result = await db.execute(
            select(UploadedDataset)
            .where(
                UploadedDataset.id == dataset_id,
                UploadedDataset.user_id == current_user.id
            )
        )
        dataset = result.scalar_one_or_none()
        
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset non trouvé ou non autorisé")
        
        # Supprimer le fichier physique si il existe
        if dataset.file_path and os.path.exists(dataset.file_path):
            try:
                os.remove(dataset.file_path)
                logger.info(f"Fichier physique supprimé: {dataset.file_path}")
            except Exception as file_error:
                logger.warning(f"Impossible de supprimer le fichier physique: {file_error}")
                # On continue même si la suppression du fichier échoue
        
        # Supprimer l'enregistrement de la base de données
        await db.execute(
            delete(UploadedDataset)
            .where(UploadedDataset.id == dataset_id)
        )
        
        await db.commit()
        
        return {
            "message": f"Dataset '{dataset.original_filename}' supprimé avec succès",
            "deleted_dataset_id": dataset_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la suppression du dataset: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression")