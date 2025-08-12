"""
Router API v2 pour la génération de données synthétiques avec optimisation
Supporte la nouvelle structure frontend avec choix d'hyperparamètres et taille d'échantillons
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.database import get_async_db
from app.models.UploadedDataset import UploadedDataset
from app.models.RequestParameters import RequestParameters
from app.models.DataRequest import DataRequest
from app.models.user import User
from app.schemas.GenerationV2 import (
    GenerationConfigRequest,
    GenerationStartResponse,
    GenerationStatusResponse,
    GenerationRequestDetails,
    GenerationProgress,
    GenerationDownloadResponse,
    GenerationRequestListResponse,
    GenerationRequestSummary,
    OptimizationResults
)
from app.dependencies.auth import get_current_user
from app.services.SyntheticDataGenerationService import SyntheticDataGenerationService
from app.services.NotificationService import NotificationService
from app.services.SupabaseStorageService import SupabaseStorageService
import asyncio
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generation/v2", tags=["Generation V2"])

# Services
generation_service = SyntheticDataGenerationService()
storage_service = SupabaseStorageService()


@router.post("/start", response_model=GenerationStartResponse)
async def start_generation_v2(
    config: GenerationConfigRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Démarre la génération de données synthétiques avec la nouvelle structure
    Supporte à la fois le mode simple et l'optimisation
    """
    try:
        # Vérifier que le dataset existe et appartient à l'utilisateur
        result = await db.execute(
            select(UploadedDataset).where(
                and_(
                    UploadedDataset.id == config.dataset_id,
                    UploadedDataset.user_id == current_user.id
                )
            )
        )
        dataset = result.scalar_one_or_none()
        
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset non trouvé ou non autorisé"
            )

        # Créer une requête de génération
        generation_request = DataRequest(
            user_id=current_user.id,
            request_name=f"Génération {config.model_type.upper()} - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            dataset_name=dataset.original_filename,
            status="pending"
        )
        
        db.add(generation_request)
        await db.flush()
        
        # Créer les paramètres selon le mode
        if config.mode == 'simple':
            parameters = RequestParameters(
                request_id=generation_request.id,
                model_type=config.model_type,
                sample_size=config.sample_size,
                mode=config.mode,
                epochs=config.epochs,
                batch_size=config.batch_size,
                learning_rate=config.learning_rate,
                generator_lr=config.generator_lr,
                discriminator_lr=config.discriminator_lr,
                optimization_enabled=False,
                optimization_method="none",
                optimization_n_trials=0,
                hyperparameters=[]
            )
        else:  # mode == 'optimization'
            parameters = RequestParameters(
                request_id=generation_request.id,
                model_type=config.model_type,
                sample_size=config.sample_size,
                mode=config.mode,
                epochs=300,  # Valeurs par défaut, seront optimisées
                batch_size=500,
                learning_rate=0.0002,
                optimization_enabled=True,
                optimization_method=config.optimization_method,
                optimization_n_trials=config.n_trials,
                hyperparameters=config.hyperparameters
            )
        
        db.add(parameters)
        await db.commit()
        await db.refresh(generation_request)
        
        # Estimer le temps de génération
        estimated_time = _estimate_generation_time(config)
        
        # Lancer la génération en arrière-plan
        background_tasks.add_task(
            _process_generation_v2,
            generation_request.id,
            config.sample_size,
            dataset.file_path or dataset.original_filename
        )
        
        # Envoyer une notification
        try:
            await NotificationService.send_notification(
                db=db,
                user_id=current_user.id,
                message=f"Génération démarrée: {config.sample_size:,} échantillons avec {config.model_type.upper()}"
            )
        except Exception as e:
            logger.warning(f"Erreur notification: {e}")
        
        return GenerationStartResponse(
            message="Génération démarrée avec succès",
            request_id=generation_request.id,
            status="pending",
            mode=config.mode,
            estimated_time_minutes=estimated_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erreur lors du démarrage de la génération: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur interne: {str(e)}"
        )


@router.get("/requests", response_model=GenerationRequestListResponse)
async def get_generation_requests_v2(
    page: int = Query(1, ge=1, description="Numéro de page"),
    page_size: int = Query(20, ge=1, le=100, description="Taille de page"),
    status_filter: Optional[str] = Query(None, description="Filtrer par statut"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupère la liste des requêtes de génération avec pagination
    """
    try:
        # Construire la requête de base
        query = select(DataRequest).where(DataRequest.user_id == current_user.id)
        
        # Appliquer le filtre de statut si fourni
        if status_filter:
            query = query.where(DataRequest.status == status_filter)
        
        # Appliquer la pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(DataRequest.created_at.desc())
        
        result = await db.execute(query)
        requests = result.scalars().all()
        
        # Compter le total
        count_query = select(DataRequest).where(DataRequest.user_id == current_user.id)
        if status_filter:
            count_query = count_query.where(DataRequest.status == status_filter)
        
        # Convertir en résumés
        summaries = []
        for req in requests:
            # Récupérer les paramètres pour obtenir le modèle et la taille
            params_result = await db.execute(
                select(RequestParameters).where(RequestParameters.request_id == req.id)
            )
            params = params_result.scalar_one_or_none()
            
            summaries.append(GenerationRequestSummary(
                id=req.id,
                request_name=req.request_name,
                dataset_name=req.dataset_name,
                model_type=params.model_type if params else "unknown",
                sample_size=2000,  # TODO: Récupérer la vraie taille depuis les paramètres
                status=req.status,
                mode="optimization" if params and params.optimization_enabled else "simple",
                quality_score=getattr(req, 'quality_score', None),
                created_at=req.created_at,
                completed_at=getattr(req, 'completed_at', None)
            ))
        
        return GenerationRequestListResponse(
            requests=summaries,
            total=len(summaries),  # TODO: Implémenter le comptage réel
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des requêtes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des requêtes"
        )


@router.get("/requests/{request_id}/status", response_model=GenerationStatusResponse)
async def get_generation_status_v2(
    request_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupère le statut détaillé d'une génération avec progression
    """
    try:
        # Récupérer la requête
        result = await db.execute(
            select(DataRequest).where(
                and_(
                    DataRequest.id == request_id,
                    DataRequest.user_id == current_user.id
                )
            )
        )
        request = result.scalar_one_or_none()
        
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Requête non trouvée"
            )
        
        # Récupérer les paramètres
        params_result = await db.execute(
            select(RequestParameters).where(RequestParameters.request_id == request_id)
        )
        params = params_result.scalar_one_or_none()
        
        # Construire les détails de la requête
        request_details = GenerationRequestDetails(
            id=request.id,
            user_id=request.user_id,
            dataset_id=1,  # TODO: Récupérer le vrai dataset_id
            status=request.status,
            mode="optimization" if params and params.optimization_enabled else "simple",
            model_type=params.model_type if params else "unknown",
            sample_size=2000,  # TODO: Récupérer la vraie taille
            created_at=request.created_at,
            started_at=getattr(request, 'started_at', None),
            completed_at=getattr(request, 'completed_at', None),
            error_message=getattr(request, 'error_message', None),
            quality_score=getattr(request, 'quality_score', None),
            generation_time=getattr(request, 'generation_time', None),
            synthetic_data_path=getattr(request, 'synthetic_data_path', None),
            optimization_results=None,  # TODO: Implémenter
            best_parameters=None  # TODO: Implémenter
        )
        
        # Construire les informations de progression
        progress = None
        if request.status == "processing":
            # TODO: Récupérer la vraie progression depuis les logs ou métadonnées
            progress = GenerationProgress(
                current_epoch=50,  # Exemple
                total_epochs=300,
                estimated_time_remaining="5 minutes",
                current_trial=None,
                total_trials=None,
                best_score_so_far=None
            )
        
        return GenerationStatusResponse(
            request=request_details,
            progress=progress,
            can_download=request.status == "completed" and hasattr(request, 'synthetic_data_path'),
            can_cancel=request.status in ["pending", "processing"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du statut: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération du statut"
        )


@router.get("/requests/{request_id}/download", response_model=GenerationDownloadResponse)
async def download_generation_v2(
    request_id: int,
    format: str = Query("csv", regex="^(csv|json|parquet)$"),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Génère une URL de téléchargement pour les données synthétiques
    """
    try:
        # Vérifier que la requête existe et est terminée
        result = await db.execute(
            select(DataRequest).where(
                and_(
                    DataRequest.id == request_id,
                    DataRequest.user_id == current_user.id
                )
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
        
        # Générer l'URL de téléchargement
        synthetic_data_path = getattr(request, 'synthetic_data_path', None)
        if not synthetic_data_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fichier de données synthétiques non trouvé"
            )
        
        # TODO: Implémenter la génération d'URL signée avec Supabase
        download_url = f"https://example.com/download/{request_id}.{format}"
        expires_at = datetime.now().replace(hour=23, minute=59, second=59)
        
        return GenerationDownloadResponse(
            download_url=download_url,
            expires_at=expires_at,
            file_size=None,  # TODO: Calculer la taille réelle
            file_format=format
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la génération de l'URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la génération de l'URL de téléchargement"
        )


@router.delete("/requests/{request_id}")
async def cancel_generation_v2(
    request_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Annule une génération en cours ou supprime une requête terminée
    """
    try:
        result = await db.execute(
            select(DataRequest).where(
                and_(
                    DataRequest.id == request_id,
                    DataRequest.user_id == current_user.id
                )
            )
        )
        request = result.scalar_one_or_none()
        
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Requête non trouvée"
            )
        
        if request.status in ["pending", "processing"]:
            # Annuler la génération
            request.status = "cancelled"
            await db.commit()
            
            # Notification d'annulation
            try:
                await NotificationService.send_notification(
                    db=db,
                    user_id=current_user.id,
                    message=f"Génération #{request_id} annulée"
                )
            except Exception as e:
                logger.warning(f"Erreur notification: {e}")
            
            return {"message": "Génération annulée"}
        
        elif request.status in ["completed", "failed", "cancelled"]:
            # Supprimer la requête et ses données
            await db.delete(request)
            await db.commit()
            
            return {"message": "Requête supprimée"}
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Impossible d'annuler une requête avec le statut: {request.status}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'annulation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'annulation"
        )


@router.get("/requests/{request_id}/optimization", response_model=OptimizationResults)
async def get_optimization_results_v2(
    request_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupère les résultats d'optimisation pour une requête
    """
    try:
        # Vérifier que la requête existe
        result = await db.execute(
            select(DataRequest).where(
                and_(
                    DataRequest.id == request_id,
                    DataRequest.user_id == current_user.id
                )
            )
        )
        request = result.scalar_one_or_none()
        
        if not request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Requête non trouvée"
            )
        
        # Vérifier que c'est une requête avec optimisation
        params_result = await db.execute(
            select(RequestParameters).where(RequestParameters.request_id == request_id)
        )
        params = params_result.scalar_one_or_none()
        
        if not params or not params.optimization_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cette requête n'utilise pas l'optimisation"
            )
        
        # TODO: Récupérer les vrais résultats d'optimisation
        # Pour l'instant, retourner des données d'exemple
        return OptimizationResults(
            config_id=1,
            request_id=request_id,
            method=params.optimization_search_type,
            total_trials=params.optimization_n_trials,
            completed_trials=params.optimization_n_trials if request.status == "completed" else 0,
            best_score=0.85 if request.status == "completed" else None,
            best_parameters={"epochs": 350, "batch_size": 750} if request.status == "completed" else None,
            all_trials=[]  # TODO: Implémenter
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des résultats d'optimisation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des résultats d'optimisation"
        )


# === Fonctions utilitaires ===

def _estimate_generation_time(config: GenerationConfigRequest) -> int:
    """Estime le temps de génération en minutes"""
    base_time = 5  # 5 minutes de base
    
    # Ajuster selon la taille
    size_factor = config.sample_size / 1000
    time_from_size = base_time * (1 + size_factor * 0.3)
    
    # Ajuster selon le mode
    if config.mode == 'optimization':
        optimization_factor = (config.n_trials or 10) * 0.8
        time_from_size *= optimization_factor
    
    # Ajuster selon le modèle
    if config.model_type == 'tvae':
        time_from_size *= 1.2  # TVAE est généralement plus lent
    
    return max(2, int(time_from_size))


async def _process_generation_v2(request_id: int, sample_size: int, dataset_path: str):
    """
    Traite une requête de génération en arrière-plan
    Version améliorée avec support de la nouvelle structure
    """
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
        
        logger.info(f"Démarrage de la génération v2 pour la requête {request_id}")
        
        # Récupérer les paramètres
        params = db.query(RequestParameters).filter(
            RequestParameters.request_id == request_id
        ).first()
        
        if not params:
            raise Exception("Paramètres non trouvés")
        
        # Simuler la génération pour l'instant
        # TODO: Intégrer avec le vrai service de génération
        await asyncio.sleep(2)  # Simulation
        
        # Simuler différents résultats selon le mode
        if params.optimization_enabled:
            # Mode optimisation - simulation plus longue
            for trial in range(params.optimization_n_trials):
                await asyncio.sleep(1)  # Simulation de chaque trial
                logger.info(f"Trial {trial + 1}/{params.optimization_n_trials} pour la requête {request_id}")
        
        # Finaliser la requête
        request.status = "completed"
        request.completed_at = datetime.utcnow()
        request.quality_score = 0.85  # Score simulé
        request.generation_time = 120.5  # Temps simulé
        db.commit()
        
        logger.info(f"Génération v2 terminée pour la requête {request_id}")
        
        # Envoyer notification de succès
        try:
            NotificationService.send_notification(
                db=db,
                user_id=request.user_id,
                message=f"Génération #{request_id} terminée avec succès! Score: 0.85"
            )
        except Exception as e:
            logger.warning(f"Erreur notification: {e}")
        
    except Exception as e:
        logger.error(f"Erreur lors de la génération v2 {request_id}: {e}")
        
        # Marquer comme échouée
        request.status = "failed"
        request.error_message = str(e)
        request.completed_at = datetime.utcnow()
        db.commit()
        
        # Envoyer notification d'échec
        try:
            NotificationService.send_notification(
                db=db,
                user_id=request.user_id,
                message=f"Génération #{request_id} échouée: {str(e)}"
            )
        except Exception as notification_error:
            logger.warning(f"Erreur notification: {notification_error}")
    
    finally:
        db.close()
