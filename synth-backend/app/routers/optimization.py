from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.DataRequest import DataRequest
from app.models.OptimizationConfig import OptimizationConfig
from app.models.OptimizationTrial import OptimizationTrial
from app.schemas.Optimization import OptimizationConfigCreate, OptimizationConfigOut, OptimizationTrialOut
from app.dependencies.auth import get_current_user
from app.services.OptimizationService import OptimizationService
from typing import List

router = APIRouter(prefix="/optimization", tags=["Optimization"])

@router.post("/config", response_model=OptimizationConfigOut)
async def create_optimization_config(
    config_data: OptimizationConfigCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Créer une configuration d'optimisation"""
    # Vérifier que la requête existe et appartient à l'utilisateur
    data_request = db.query(DataRequest).filter(
        DataRequest.id == config_data.request_id,
        DataRequest.user_id == user.id
    ).first()
    
    if not data_request:
        raise HTTPException(status_code=404, detail="Data request not found")
    
    # Créer la configuration
    config = OptimizationConfig(
        request_id=config_data.request_id,
        optimization_type=config_data.optimization_type,
        max_evaluations=config_data.max_evaluations,
        timeout_minutes=config_data.timeout_minutes,
        search_space=config_data.search_space.dict(),
        acquisition_function=config_data.acquisition_function
    )
    
    db.add(config)
    db.commit()
    db.refresh(config)
    return config

@router.post("/start/{config_id}")
async def start_optimization(
    config_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    optimization_service: OptimizationService = Depends(OptimizationService)
):
    """Démarrer le processus d'optimisation"""
    config = db.query(OptimizationConfig).join(DataRequest).filter(
        OptimizationConfig.id == config_id,
        DataRequest.user_id == user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Optimization config not found")
    
    if config.status == "running":
        raise HTTPException(status_code=400, detail="Optimization already running")
    
    # Démarrer l'optimisation en arrière-plan
    background_tasks.add_task(
        optimization_service.run_optimization,
        db, config_id
    )
    
    # Mettre à jour le statut
    config.status = "running"
    db.commit()
    
    return {"message": "Optimization started", "config_id": config_id}

@router.get("/config/{config_id}", response_model=OptimizationConfigOut)
async def get_optimization_config(
    config_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Récupérer une configuration d'optimisation"""
    config = db.query(OptimizationConfig).join(DataRequest).filter(
        OptimizationConfig.id == config_id,
        DataRequest.user_id == user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    return config

@router.get("/trials/{config_id}", response_model=List[OptimizationTrialOut])
async def get_optimization_trials(
    config_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Récupérer tous les essais d'une optimisation"""
    config = db.query(OptimizationConfig).join(DataRequest).filter(
        OptimizationConfig.id == config_id,
        DataRequest.user_id == user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    trials = db.query(OptimizationTrial).filter(
        OptimizationTrial.config_id == config_id
    ).order_by(OptimizationTrial.trial_number).all()
    
    return trials

@router.get("/best-parameters/{config_id}")
async def get_best_parameters(
    config_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Récupérer les meilleurs paramètres trouvés"""
    config = db.query(OptimizationConfig).join(DataRequest).filter(
        OptimizationConfig.id == config_id,
        DataRequest.user_id == user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    best_trial = db.query(OptimizationTrial).filter(
        OptimizationTrial.config_id == config_id,
        OptimizationTrial.quality_score.isnot(None)
    ).order_by(OptimizationTrial.quality_score.desc()).first()
    
    if not best_trial:
        raise HTTPException(status_code=404, detail="No completed trials found")
    
    return {
        "config_id": config_id,
        "best_parameters": best_trial.parameters,
        "best_score": best_trial.quality_score,
        "trial_number": best_trial.trial_number
    }

@router.delete("/config/{config_id}")
async def stop_optimization(
    config_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Arrêter une optimisation en cours"""
    config = db.query(OptimizationConfig).join(DataRequest).filter(
        OptimizationConfig.id == config_id,
        DataRequest.user_id == user.id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    config.status = "stopped"
    db.commit()
    
    return {"message": "Optimization stopped"}