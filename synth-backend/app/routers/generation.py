from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_async_db
from app.models.UploadedDataset import UploadedDataset
from app.models.RequestParameters import RequestParameters
from app.models.DataRequest import DataRequest
from app.models.SyntheticDataset import SyntheticDataset
from app.models.user import User
from app.schemas.UploadedDataset import GenerationRequestCreate, GenerationRequestOut
from app.schemas.RequestParameters import RequestParametersBase
from app.dependencies.auth import get_current_user
from app.services.SyntheticDataGenerationService import SyntheticDataGenerationService
from app.services.NotificationService import NotificationService
from app.services.SupabaseStorageService import SupabaseStorageService
import os
import uuid
from datetime import datetime
from sqlalchemy import select


router = APIRouter(prefix="/generation", tags=["Generation"])

# Services
generation_service = SyntheticDataGenerationService()
storage_service = SupabaseStorageService()


class GenerationRequestWithParams:
    def __init__(self, request: GenerationRequestCreate, params: RequestParametersBase):
        self.request = request
        self.params = params


@router.post("/start", response_model=GenerationRequestOut)
async def start_generation(
    request_data: dict,  # Accepter un dict pour plus de flexibilité
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Démarre la génération de données synthétiques
    Structure attendue:
    {
        "request": {
            "request_name": "...",
            "uploaded_dataset_id": 1,
            "n_samples": 1000
        },
        "params": {
            "model_type": "ctgan",
            "epochs": 300,
            "batch_size": 500,
            "learning_rate": 0.0002,
            "optimization_enabled": true,
            "optimization_search_type": "bayesian",
            "optimization_n_trials": 5,
            "hyperparameters": ["epochs", "batch_size"]
        }
    }
    """
    try:
        # Extraire les données de la requête
        request_info = request_data.get("request", {})
        params_info = request_data.get("params", {})
        
        # Vérifier que le dataset existe et appartient à l'utilisateur
        result = await db.execute(
            select(UploadedDataset).where(
                UploadedDataset.id == request_info.get("uploaded_dataset_id"),
                UploadedDataset.user_id == current_user.id
            )
        )
        dataset = result.scalar_one_or_none()
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset non trouvé"
            )
        
        # Créer la requête de génération
        generation_request = DataRequest(
            user_id=current_user.id,
            # uploaded_dataset_id=dataset.id,  # Temporairement commenté - colonne n'existe pas encore
            request_name=request_info.get("request_name"),
            dataset_name=dataset.original_filename,  # Utiliser le nom du dataset
            status="pending"
        )
        
        db.add(generation_request)
        await db.flush()
        
        # Créer les paramètres
        parameters = RequestParameters(
            request_id=generation_request.id,
            model_type=params_info.get("model_type", "ctgan"),
            # n_samples=request_info.get("n_samples", 1000),  # Temporairement commenté - colonne n'existe pas encore
            epochs=params_info.get("epochs", 300),
            batch_size=params_info.get("batch_size", 500),
            learning_rate=params_info.get("learning_rate", 0.0002),
            optimization_enabled=params_info.get("optimization_enabled", False),
            optimization_search_type=params_info.get("optimization_search_type", "grid"),
            optimization_n_trials=params_info.get("optimization_n_trials", 5),
            hyperparameters=params_info.get("hyperparameters", [])
        )
        
        db.add(parameters)
        await db.commit()
        await db.refresh(generation_request)
        
        # Lancer la génération en arrière-plan
        background_tasks.add_task(
            _process_generation_task,
            generation_request.id
        )
        
        # Envoyer une notification
        NotificationService.send_notification(
            db=db,
            user_id=current_user.id,
            message=f"Génération '{generation_request.request_name}' démarrée avec {generation_request.n_samples} échantillons."
        )
        
        return generation_request
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du démarrage de la génération: {str(e)}"
        )


@router.get("/requests/{request_id}/status")
async def get_generation_status(
    request_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupère le statut et la progression d'une génération
    """
    result = await db.execute(
        select(DataRequest).where(
            DataRequest.id == request_id,
            DataRequest.user_id == current_user.id
        )
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requête non trouvée"
        )
    
    return {
        "request_id": request.id,
        "status": request.status,
        "progress": getattr(request, 'progress', 0),
        "error_message": getattr(request, 'error_message', None),
        "quality_score": getattr(request, 'quality_score', None),
        "generation_time": getattr(request, 'generation_time', None),
        "can_download": request.status == "completed"  # Simplified - check will be done in download endpoint
    }


@router.get("/requests/{request_id}/download")
async def download_synthetic_data(
    request_id: int,
    format: str = "csv",  # csv, json
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Télécharge les données synthétiques générées
    """
    # Vérifier que la requête existe et appartient à l'utilisateur
    result = await db.execute(
        select(DataRequest).where(
            DataRequest.id == request_id,
            DataRequest.user_id == current_user.id
        )
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requête non trouvée"
        )
    
    if request.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La génération n'est pas terminée"
        )
    
    # Récupérer le dataset synthétique associé
    dataset_result = await db.execute(
        select(SyntheticDataset).where(
            SyntheticDataset.request_id == request_id,
            SyntheticDataset.user_id == current_user.id
        )
    )
    synthetic_dataset = dataset_result.scalar_one_or_none()
    
    if not synthetic_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset synthétique non trouvé"
        )
    
    if not synthetic_dataset.storage_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier de données synthétiques non trouvé dans le stockage"
        )
    
    # Générer une URL de téléchargement signée depuis Supabase
    try:
        download_url = storage_service.get_download_url(synthetic_dataset.storage_path)
        return {
            "download_url": download_url,
            "file_name": synthetic_dataset.file_name,
            "file_size": synthetic_dataset.file_size,
            "file_format": synthetic_dataset.file_format
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération de l'URL de téléchargement: {str(e)}"
        )


@router.delete("/requests/{request_id}")
async def cancel_generation(
    request_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Annule ou supprime une requête de génération
    """
    result = await db.execute(
        select(DataRequest).where(
            DataRequest.id == request_id,
            DataRequest.user_id == current_user.id
        )
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requête non trouvée"
        )
    
    # Si la génération est en cours, marquer comme annulée
    if request.status in ["pending", "processing"]:
        request.status = "cancelled"
        await db.commit()
        return {"message": "Génération annulée"}
    
    # Si terminée, supprimer complètement
    if request.output_file_path and os.path.exists(request.output_file_path):
        os.remove(request.output_file_path)
    
    await db.delete(request)
    await db.commit()
    
    return {"message": "Requête supprimée"}


# Fonction de traitement en arrière-plan
def _process_generation_task(request_id: int):
    """
    Traite une requête de génération en arrière-plan
    """
    # Importer et créer une nouvelle session pour cette tâche
    from app.db.database import SessionLocal
    db = SessionLocal()
    
    try:
        # Récupérer la requête
        request = db.query(DataRequest).filter(DataRequest.id == request_id).first()
        if not request:
            return
        
        # Marquer comme en cours
        request.status = "processing"
        request.started_at = datetime.utcnow()
        db.commit()
        
        # Récupérer les paramètres
        params = db.query(RequestParameters).filter(
            RequestParameters.request_id == request_id
        ).first()
        
        # Récupérer le dataset
        dataset = db.query(UploadedDataset).filter(
            UploadedDataset.id == request.uploaded_dataset_id
        ).first()
        
        # Fonction de callback pour la progression
        def update_progress(progress: float, message: str):
            request.progress = progress
            if len(request.logs) < 100:  # Limiter les logs
                request.logs.append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "message": message,
                    "progress": progress
                })
            db.commit()
        
        # Préparer la configuration d'optimisation
        optimization_config = None
        if params.optimization_enabled:
            optimization_config = {
                'enabled': True,
                'search_type': params.optimization_search_type,
                'n_trials': params.optimization_n_trials,
                'hyperparameters': params.hyperparameters or []
            }
        
        # Simuler la génération pour l'instant (à remplacer par le vrai service)
        import time
        for i in range(0, 101, 10):
            update_progress(i, f"Génération en cours... {i}%")
            time.sleep(0.1)  # Simuler le travail
        
        # Simuler des résultats
        result = {
            'synthetic_data': None,  # À remplacer par les vraies données
            'quality_score': 0.85,
            'generation_time': 5.2
        }
        
        # Mettre à jour la requête
        request.status = "completed"
        request.progress = 100.0
        request.completed_at = datetime.utcnow()
        request.quality_score = result['quality_score']
        request.generation_time = result['generation_time']
        
        db.commit()
        
        # Envoyer une notification de succès
        NotificationService.send_notification(
            db=db,
            user_id=request.user_id,
            message=f"Génération '{request.request_name}' terminée avec succès! Score de qualité: {result['quality_score']:.2f}"
        )
        
    except Exception as e:
        # Marquer comme échouée
        request.status = "failed"
        request.error_message = str(e)
        request.completed_at = datetime.utcnow()
        db.commit()
        
        # Envoyer une notification d'échec
        NotificationService.send_notification(
            db=db,
            user_id=request.user_id,
            message=f"Génération '{request.request_name}' échouée: {str(e)}"
        )
    
    finally:
        db.close()
