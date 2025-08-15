from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.database import get_db
from app.models.DataRequest import DataRequest
from app.models.SyntheticDataset import SyntheticDataset
from app.models.RequestParameters import RequestParameters
from app.models.Notification import Notification
from app.models.OptimizationResult import OptimizationResult
from app.models.OptimizationConfig import OptimizationConfig
from app.schemas.DataRequest import DataRequestOut
from app.schemas.RequestParameters import RequestParametersOut
from app.schemas.Notification import NotificationCreate, NotificationOut
from app.schemas.Optimization import OptimizationConfigCreate
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.DataRequest import DataRequestWithParams
from app.ai.services.AIProcessingService import AIProcessingService
from app.services.NotificationService import NotificationService
from app.services.SimpleSupabaseStorage import SimpleSupabaseStorage
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/data", tags=["Data"])

# Services - Utiliser SimpleSupabaseStorage au lieu de SupabaseStorageService
storage_service = SimpleSupabaseStorage()

@router.get("/requests", response_model=List[DataRequestOut])
def get_all_data_requests(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Retrieve all data generation requests for the current user.
    """
    try:
        logger.info(f"Getting data requests for user ID: {user.id}")
        logger.info(f"User details: {user.email if hasattr(user, 'email') else 'No email'}")
        
        # Vérifier la connexion à la base de données
        logger.info("Checking database connection...")
        
        # Compter le nombre total de DataRequest dans la base
        total_requests = db.query(DataRequest).count()
        logger.info(f"Total DataRequest records in database: {total_requests}")
        
        # Récupérer les requêtes pour cet utilisateur avec eager loading
        requests = db.query(DataRequest).options(
            # Charger explicitement les relations
            # joinedload(DataRequest.request_parameters)
        ).filter(DataRequest.user_id == user.id).all()
        
        logger.info(f"Found {len(requests)} requests for user {user.id}")
        
        if not requests:
            logger.warning(f"No requests found for user {user.id}")
            # Retourner une liste vide au lieu de 404
            return []
        
        # Convertir manuellement les objets pour éviter les erreurs de validation
        result = []
        for request in requests:
            try:
                request_dict = {
                    "id": request.id,
                    "user_id": request.user_id,
                    "request_name": request.request_name,
                    "dataset_name": request.dataset_name,
                    "status": request.status or "pending",
                    "created_at": request.created_at,
                    "updated_at": request.updated_at,
                    "request_parameters": None  # À implémenter plus tard si nécessaire
                }
                result.append(request_dict)
            except Exception as e:
                logger.error(f"Error serializing request {request.id}: {str(e)}")
                continue
        
        logger.info(f"Returning {len(result)} requests")
        return result
        
    except Exception as e:
        logger.error(f"Error in get_all_data_requests: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
    

    # ...existing code...

@router.delete("/requests/{request_id}")
def delete_data_request(
    request_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Supprimer une requête de génération de données.
    """
    try:
        logger.info(f"Attempting to delete request {request_id} for user {user.id}")
        
        # Vérifier que la requête existe et appartient à l'utilisateur
        request = db.query(DataRequest).filter(
            DataRequest.id == request_id,
            DataRequest.user_id == user.id
        ).first()
        
        if not request:
            logger.warning(f"Request {request_id} not found for user {user.id}")
            raise HTTPException(
                status_code=404, 
                detail="Requête non trouvée ou vous n'avez pas les permissions"
            )
        
        # Supprimer d'abord les paramètres associés (si ils existent)
        db.query(RequestParameters).filter(
            RequestParameters.request_id == request_id
        ).delete()
        
        # Supprimer les notifications associées (si elles existent)
        db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.message.contains(request.request_name)
        ).delete(synchronize_session=False)
        
        # Supprimer les résultats d'optimisation associés (si ils existent)
        db.query(OptimizationResult).filter(
            OptimizationResult.request_id == request_id
        ).delete()
        
        # Supprimer la configuration d'optimisation associée (si elle existe)
        db.query(OptimizationConfig).filter(
            OptimizationConfig.request_id == request_id
        ).delete()
        
        # Finalement, supprimer la requête principale
        db.delete(request)
        db.commit()
        
        logger.info(f"Successfully deleted request {request_id}")
        
        # Envoyer une notification de suppression
        try:
            NotificationService.send_notification(
                db=db,
                user_id=user.id,
                message=f"La requête '{request.request_name}' a été supprimée avec succès."
            )
        except Exception as notif_error:
            logger.warning(f"Failed to send deletion notification: {notif_error}")
        
        return {"message": "Requête supprimée avec succès", "deleted_id": request_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting request {request_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la suppression de la requête"
        )

@router.put("/requests/{request_id}", response_model=DataRequestOut)
def update_data_request(
    request_id: int,
    data: DataRequestWithParams,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Update an existing data generation request.
    """
    try:
        logger.info(f"Updating request {request_id} for user {user.id}")
        
        # Retrieve the existing request
        request = db.query(DataRequest).filter(
            DataRequest.id == request_id,
            DataRequest.user_id == user.id
        ).first()
        
        if not request:
            raise HTTPException(status_code=404, detail="Request not found or unauthorized")
        
        # Update the request fields
        request.request_name = data.request.request_name
        request.dataset_name = data.request.dataset_name
        
        # Update or create the parameters
        if data.params:
            params = db.query(RequestParameters).filter(
                RequestParameters.request_id == request_id
            ).first()
            
            if not params:
                params = RequestParameters(request_id=request_id)
                db.add(params)
            
            params.model_type = data.params.model_type
            params.epochs = data.params.epochs
            params.batch_size = data.params.batch_size
            params.learning_rate = data.params.learning_rate
            
            params.optimization_enabled = data.params.optimization_enabled
            params.optimization_method = data.params.optimization_method
            params.optimization_n_trials = data.params.optimization_n_trials
            params.hyperparameters = data.params.hyperparameters or []
        
        db.commit()
        db.refresh(request)
        
        logger.info(f"Successfully updated request {request.id}")
        return request
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating data request {request_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/requests", response_model=DataRequestOut)
def create_data_request(
    data: DataRequestWithParams,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    try:
        logger.info(f"Creating data request for user {user.id}")
        logger.info(f"Request data: {data.request.request_name}")
        
        # Créer la requête
        data_request = DataRequest(
            user_id=user.id,
            request_name=data.request.request_name,
            dataset_name=data.request.dataset_name
        )
        db.add(data_request)
        db.flush()

        # Créer les paramètres associés
        params = RequestParameters(
            request_id=data_request.id,
            model_type=data.params.model_type,
            epochs=data.params.epochs,
            batch_size=data.params.batch_size,
            learning_rate=data.params.learning_rate,
            optimization_enabled=data.params.optimization_enabled,
            optimization_method=data.params.optimization_method,
            optimization_n_trials=data.params.optimization_n_trials,
            hyperparameters=data.params.hyperparameters or [],
        )
        db.add(params)
        db.commit()
        db.refresh(data_request)

        # Envoyer une notification à l'utilisateur
        try:
            NotificationService.send_notification(
                db=db,
                user_id=user.id,
                message=f"Votre demande '{data_request.request_name}' a été créée avec succès."
            )
        except Exception as notif_error:
            logger.warning(f"Failed to send notification: {notif_error}")

        # Retourner la réponse sérialisée manuellement
        result = {
            "id": data_request.id,
            "user_id": data_request.user_id,
            "request_name": data_request.request_name,
            "dataset_name": data_request.dataset_name,
            "status": data_request.status or "pending",
            "created_at": data_request.created_at,
            "updated_at": data_request.updated_at,
            "request_parameters": None  # À implémenter plus tard si nécessaire
        }
        
        logger.info(f"Successfully created data request {data_request.id}")
        return result
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating data request: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/requests/{request_id}", response_model=DataRequestOut)
def get_data_request(
    request_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Retrieve a specific data generation request by its ID.
    """
    req = db.query(DataRequest).filter(
        DataRequest.id == request_id,
        DataRequest.user_id == user.id
    ).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found or unauthorized")
    return req

@router.post("/generate/{request_id}")
async def generate_synthetic_data(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: AIProcessingService = Depends(AIProcessingService)
):
    """
    Endpoint to process a synthetic data generation request.
    Supports hyperparameter optimization if enabled in the request parameters.
    """
    try:
        logger.info(f"🚀 Starting generation for request {request_id} by user {current_user.id}")
        
        # Vérifier que la requête existe et appartient à l'utilisateur
        request = db.query(DataRequest).filter(
            DataRequest.id == request_id,
            DataRequest.user_id == current_user.id
        ).first()
        
        if not request:
            logger.error(f"❌ Request {request_id} not found for user {current_user.id}")
            raise HTTPException(status_code=404, detail="Request not found or unauthorized")
        
        logger.info(f"✅ Request found: {request.request_name}")
        
        result = await service.process_generation_request(
            db=db,
            request_id=request_id,
            current_user_id=current_user.id
        )
        
        logger.info(f"✅ Generation completed for request {request_id}")
        return result
        
    except HTTPException as e:
        logger.error(f"❌ HTTP error in generate_synthetic_data: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"❌ Unexpected error in generate_synthetic_data: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/optimization/{request_id}")
async def get_optimization_results(
    request_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Endpoint to retrieve the results of hyperparameter optimization.
    """
    optimization_result = db.query(OptimizationResult).filter(
        OptimizationResult.request_id == request_id
    ).join(DataRequest).filter(DataRequest.user_id == user.id).first()

    if not optimization_result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Optimization results not found")

    return {
        "request_id": request_id,
        "best_parameters": optimization_result.best_parameters,
        "quality_score": optimization_result.quality_score
    }


@router.post("/generate-with-optimization/{request_id}")
async def generate_with_optimization(
    request_id: int,
    optimization_config: OptimizationConfigCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: AIProcessingService = Depends(AIProcessingService)
):
    """
    Endpoint to generate data with hyperparameter optimization.
    """
    data_request = db.query(DataRequest).filter(
        DataRequest.id == request_id,
        DataRequest.user_id == current_user.id
    ).first()
    
    if not data_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    
    try:
        config = OptimizationConfig(
            request_id=request_id,
            optimization_type=optimization_config.optimization_type,
            max_evaluations=optimization_config.max_evaluations,
            timeout_minutes=optimization_config.timeout_minutes,
            search_space=optimization_config.search_space.dict(),
            acquisition_function=optimization_config.acquisition_function
        )
        
        db.add(config)
        db.commit()
        db.refresh(config)
        
        background_tasks.add_task(
            service.process_generation_with_optimization,
            db=db,
            request_id=request_id,
            config_id=config.id,
            current_user_id=current_user.id
        )
        
        return {
            "message": "Generation with optimization started",
            "request_id": request_id,
            "optimization_config_id": config.id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/requests/pending")
def get_pending_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupérer les requêtes en attente (Admin seulement)
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé. Admin requis.")
    
    requests = db.query(DataRequest).filter(DataRequest.status == "pending").order_by(DataRequest.created_at.asc()).all()
    
    return [
        {
            "id": req.id,
            "request_name": req.request_name,
            "dataset_name": req.dataset_name,
            "user_id": req.user_id,
            "created_at": req.created_at,
            "status": req.status
        }
        for req in requests
    ]

@router.get("/requests/{request_id}/download")
async def download_synthetic_data(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Télécharge les données synthétiques générées
    """
    # Vérifier que la requête existe et appartient à l'utilisateur
    data_request = db.query(DataRequest).filter(
        DataRequest.id == request_id,
        DataRequest.user_id == current_user.id
    ).first()
    
    if not data_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requête non trouvée"
        )
    
    if data_request.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La génération n'est pas terminée"
        )
    
    # Récupérer le dataset synthétique associé
    synthetic_dataset = db.query(SyntheticDataset).filter(
        SyntheticDataset.request_id == request_id,
        SyntheticDataset.user_id == current_user.id
    ).first()
    
    if not synthetic_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset synthétique non trouvé"
        )
    
    # Vérifier si une URL de téléchargement existe déjà et est encore valide
    if synthetic_dataset.download_url and synthetic_dataset.url_expires_at:
        # Vérifier si l'URL n'est pas expirée
        from datetime import datetime, timezone
        current_time = datetime.now(timezone.utc)
        expires_at = synthetic_dataset.url_expires_at
        
        # S'assurer que expires_at a un timezone
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at > current_time:
            # URL encore valide
            logger.info(f"Using existing valid download URL for request {request_id}")
            return {
                "download_url": synthetic_dataset.download_url,
                "file_name": synthetic_dataset.file_name,
                "file_size": synthetic_dataset.file_size,
                "file_format": synthetic_dataset.file_format
            }
        else:
            logger.info(f"Download URL expired for request {request_id}, will regenerate")
    elif synthetic_dataset.download_url:
        # URL existe mais pas d'info d'expiration, on l'utilise quand même
        logger.info(f"Using existing download URL for request {request_id} (no expiration info)")
        return {
            "download_url": synthetic_dataset.download_url,
            "file_name": synthetic_dataset.file_name,
            "file_size": synthetic_dataset.file_size,
            "file_format": synthetic_dataset.file_format
        }
    
    # Si pas d'URL ou URL expirée, essayer d'en générer une nouvelle
    if not synthetic_dataset.storage_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier de données synthétiques non trouvé dans le stockage"
        )
    
    # Générer une URL de téléchargement signée depuis Supabase
    try:
        download_url = await storage_service.get_download_url(synthetic_dataset.storage_path)
        if download_url:
            # Mettre à jour l'URL et l'expiration dans la base de données
            from datetime import datetime, timezone, timedelta
            synthetic_dataset.download_url = download_url
            synthetic_dataset.url_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
            db.commit()
            logger.info(f"Generated new download URL for request {request_id}")
        else:
            # Si la génération d'URL signée échoue, créer une URL de fallback
            # qui passe par notre backend
            fallback_url = f"{request.url.scheme}://{request.url.netloc}/data/requests/{request_id}/download-direct"
            logger.warning(f"Using fallback direct download URL for request {request_id}")
            return {
                "download_url": fallback_url,
                "file_name": synthetic_dataset.file_name,
                "file_size": synthetic_dataset.file_size,
                "file_format": synthetic_dataset.file_format
            }
            
        return {
            "download_url": download_url,
            "file_name": synthetic_dataset.file_name,
            "file_size": synthetic_dataset.file_size,
            "file_format": synthetic_dataset.file_format
        }
    except Exception as e:
        logger.error(f"Erreur lors de la génération de l'URL de téléchargement: {str(e)}")
        # Si génération échoue mais qu'on a une URL existante, l'utiliser quand même
        if synthetic_dataset.download_url:
            logger.warning(f"Fallback to existing URL for request {request_id}")
            return {
                "download_url": synthetic_dataset.download_url,
                "file_name": synthetic_dataset.file_name,
                "file_size": synthetic_dataset.file_size,
                "file_format": synthetic_dataset.file_format
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur lors de la génération de l'URL de téléchargement: {str(e)}"
            )

@router.get("/requests/{request_id}/download-token")
async def get_download_token(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Génère un token de téléchargement temporaire pour éviter les problèmes d'authentification
    """
    import uuid
    from datetime import datetime, timezone, timedelta
    
    # Vérifier que la requête existe et appartient à l'utilisateur
    data_request = db.query(DataRequest).filter(
        DataRequest.id == request_id,
        DataRequest.user_id == current_user.id
    ).first()
    
    if not data_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requête non trouvée"
        )
    
    if data_request.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La génération n'est pas terminée"
        )
    
    # Générer un token temporaire (UUID)
    download_token = str(uuid.uuid4())
    
    # Stocker le token temporairement (vous pourriez utiliser Redis ou une table en base)
    # Pour simplifier, on va le stocker dans la base de données
    
    # Vérifier que le dataset existe
    synthetic_dataset = db.query(SyntheticDataset).filter(
        SyntheticDataset.request_id == request_id,
        SyntheticDataset.user_id == current_user.id
    ).first()
    
    if not synthetic_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset synthétique non trouvé"
        )
    
    # Stocker le token dans le dataset (ajout d'un champ temporaire)
    synthetic_dataset.download_token = download_token
    synthetic_dataset.token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)  # 15 minutes
    db.commit()
    
    logger.info(f"Generated download token for request {request_id}")
    
    return {
        "download_token": download_token,
        "download_url": f"{settings.BACKEND_BASE_URL}/data/download-with-token/{download_token}",
        "expires_in_minutes": 15
    }

@router.get("/download-with-token/{token}")
async def download_with_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Endpoint public pour télécharger un fichier avec un token temporaire
    """
    import requests
    from fastapi.responses import StreamingResponse
    from datetime import datetime, timezone
    
    # Rechercher le dataset avec ce token
    synthetic_dataset = db.query(SyntheticDataset).filter(
        SyntheticDataset.download_token == token
    ).first()
    
    if not synthetic_dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token de téléchargement invalide"
        )
    
    # Vérifier que le token n'est pas expiré
    if synthetic_dataset.token_expires_at:
        current_time = datetime.now(timezone.utc)
        expires_at = synthetic_dataset.token_expires_at
        
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at < current_time:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Token de téléchargement expiré"
            )
    
    if not synthetic_dataset.storage_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé dans le stockage"
        )
    
    # Télécharger directement depuis Supabase
    try:
        supabase_url = settings.SUPABASE_URL
        bucket_name = settings.SUPABASE_BUCKET_NAME
        service_key = settings.SUPABASE_KEY
        
        download_url = f"{supabase_url}/storage/v1/object/{bucket_name}/{synthetic_dataset.storage_path}"
        
        headers = {
            'Authorization': f'Bearer {service_key}',
            'apikey': service_key
        }
        
        logger.info(f"Downloading from Supabase with token: {download_url}")
        
        response = requests.get(download_url, headers=headers, stream=True)
        
        if response.status_code == 200:
            content_type = "text/csv"
            if synthetic_dataset.file_format == "json":
                content_type = "application/json"
            elif synthetic_dataset.file_format == "parquet":
                content_type = "application/octet-stream"
            
            def generate():
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        yield chunk
            
            # Nettoyer le token après utilisation
            synthetic_dataset.download_token = None
            synthetic_dataset.token_expires_at = None
            db.commit()
            
            return StreamingResponse(
                generate(),
                media_type=content_type,
                headers={
                    "Content-Disposition": f"attachment; filename={synthetic_dataset.file_name}"
                }
            )
        else:
            logger.error(f"Download failed from Supabase: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Impossible de télécharger le fichier: {response.status_code}"
            )
        
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement avec token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du téléchargement: {str(e)}"
        )

@router.get("/requests/{request_id}/download-direct")
async def download_synthetic_data_direct(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Télécharge directement les données synthétiques via l'API REST Supabase optimisée
    """
    import requests
    from fastapi.responses import StreamingResponse
    
    # Vérifier que la requête existe et appartient à l'utilisateur
    data_request = db.query(DataRequest).filter(
        DataRequest.id == request_id,
        DataRequest.user_id == current_user.id
    ).first()
    
    if not data_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requête non trouvée"
        )
    
    if data_request.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La génération n'est pas terminée"
        )
    
    # Récupérer le dataset synthétique associé
    synthetic_dataset = db.query(SyntheticDataset).filter(
        SyntheticDataset.request_id == request_id,
        SyntheticDataset.user_id == current_user.id
    ).first()
    
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
    
    # Télécharger directement depuis Supabase via l'API REST
    try:
        # URL de téléchargement direct via l'API REST Supabase
        supabase_url = settings.SUPABASE_URL
        bucket_name = settings.SUPABASE_BUCKET_NAME
        service_key = settings.SUPABASE_KEY
        
        # URL directe pour l'objet
        download_url = f"{supabase_url}/storage/v1/object/{bucket_name}/{synthetic_dataset.storage_path}"
        
        # Headers avec authentification
        headers = {
            'Authorization': f'Bearer {service_key}',
            'apikey': service_key
        }
        
        logger.info(f"Downloading from Supabase: {download_url}")
        
        # Effectuer la requête vers Supabase
        response = requests.get(download_url, headers=headers, stream=True)
        
        if response.status_code == 200:
            # Déterminer le type de contenu
            content_type = "text/csv"
            if synthetic_dataset.file_format == "json":
                content_type = "application/json"
            elif synthetic_dataset.file_format == "parquet":
                content_type = "application/octet-stream"
            
            # Streamer la réponse directement depuis Supabase
            def generate():
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        yield chunk
            
            return StreamingResponse(
                generate(),
                media_type=content_type,
                headers={
                    "Content-Disposition": f"attachment; filename={synthetic_dataset.file_name}"
                }
            )
        else:
            logger.error(f"Download failed from Supabase: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Impossible de télécharger le fichier depuis Supabase: {response.status_code}"
            )
        
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement direct: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du téléchargement: {str(e)}"
        )