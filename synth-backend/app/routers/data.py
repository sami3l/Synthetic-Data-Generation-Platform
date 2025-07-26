from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.DataRequest import DataRequest
from app.models.RequestParameters import RequestParameters
from app.models.Notification import Notification
from app.schemas.DataRequest import DataRequestOut
from app.schemas.RequestParameters import RequestParametersCreate, RequestParametersOut
from app.schemas.Notification import NotificationCreate, NotificationOut
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.DataRequest import DataRequestWithParams
from app.ai.services.AIProcessingService import AIProcessingService
from app.services.NotificationService import NotificationService
from app.models.OptimizationResult import OptimizationResult
router = APIRouter(prefix="/data", tags=["Data"])

# DataRequest endpoints
@router.post("/requests", response_model=DataRequestOut)
def create_data_request(
    data: DataRequestWithParams,
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    # Créer la requête
    data_request = DataRequest(user_id=user.id, **data.request.dict())
    db.add(data_request)
    db.commit()
    db.refresh(data_request)
    
    # Créer les paramètres associés
    rp = RequestParameters(
        request_id=data_request.id,
        **data.params.dict(exclude={'request_id'})
    )
    db.add(rp)
    db.commit()
    db.refresh(rp)
    
    # Rafraîchir la requête pour inclure les paramètres
    db.refresh(data_request)
    return data_request


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
        result = await service.process_generation_request(
            db=db,
            request_id=request_id,
            current_user_id=current_user.id
        )
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/generate/{request_id}")
async def generate_synthetic_data(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    try:


        # Appel au service de traitement AI pour générer les données synthétiques
        ai_service = AIProcessingService()
        result = await ai_service.process_generation_request(
            db=db,
            request_id=request_id,
            current_user_id=current_user.id  # Passage de l'ID de l'utilisateur courant
        )
        # Si la génération est réussie, créer une notification
        if result.success:
            NotificationService.create_generation_success_notification(
                db=db,
                user_id=current_user.id,
                request_id=request_id,
                quality_score=result.quality_score
            )
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Data generation failed.")
    

@router.get("/requests/{request_id}", response_model=DataRequestOut)
def get_data_request(
    request_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    req = db.query(DataRequest).filter(
        DataRequest.id == request_id,
        DataRequest.user_id == user.id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found or unauthorized")
    return req


@router.post("/parameters", response_model=RequestParametersOut)
def create_request_parameters(
    params: RequestParametersCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    data_request = db.query(DataRequest).filter(
        DataRequest.id == params.request_id,
        DataRequest.user_id == user.id
    ).first()
    
    if not data_request:
        raise HTTPException(
            status_code=404,
            detail=f"Data request with id {params.request_id} not found or unauthorized"
        )
    
    rp = RequestParameters(**params.dict())
    db.add(rp)
    db.commit()
    db.refresh(rp)
    return rp


@router.get("/parameters/{param_id}", response_model=RequestParametersOut)
def get_request_parameters(
    param_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    rp = db.query(RequestParameters).join(DataRequest).filter(
        RequestParameters.id == param_id,
        DataRequest.user_id == user.id
    ).first()
    
    if not rp:
        raise HTTPException(status_code=404, detail="Parameters not found or unauthorized")
    return rp

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
        ).join(DataRequest).filter( DataRequest.user_id == user.id ).first()

    if not optimization_result:
        raise HTTPException(status_code=404, detail="Optimization results not found")

    return {
        "request_id": request_id,
        "best_parameters": optimization_result.best_parameters,
        "quality_score": optimization_result.quality_score
    }