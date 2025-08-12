"""
Router pour les statistiques et le monitoring de l'application
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.db.deps import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.DataRequest import DataRequest, RequestStatus
from app.models.RequestParameters import RequestParameters
from app.models.UploadedDataset import UploadedDataset
from app.models.Notification import Notification

router = APIRouter(prefix="/stats", tags=["statistics"])

@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtient les statistiques du tableau de bord pour un utilisateur"""
    
    # Statistiques des requêtes
    total_requests = db.query(DataRequest).filter(
        DataRequest.user_id == current_user.id
    ).count()
    
    completed_requests = db.query(DataRequest).filter(
        DataRequest.user_id == current_user.id,
        DataRequest.status == RequestStatus.COMPLETED
    ).count()
    
    pending_requests = db.query(DataRequest).filter(
        DataRequest.user_id == current_user.id,
        DataRequest.status.in_([RequestStatus.PENDING, RequestStatus.PROCESSING])
    ).count()
    
    failed_requests = db.query(DataRequest).filter(
        DataRequest.user_id == current_user.id,
        DataRequest.status == RequestStatus.FAILED
    ).count()
    
    # Statistiques des datasets
    total_datasets = db.query(UploadedDataset).filter(
        UploadedDataset.user_id == current_user.id
    ).count()
    
    # Requêtes récentes
    recent_requests = db.query(DataRequest).filter(
        DataRequest.user_id == current_user.id
    ).order_by(desc(DataRequest.created_at)).limit(5).all()
    
    # Activité des 7 derniers jours
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_activity = db.query(
        func.date(DataRequest.created_at).label('date'),
        func.count(DataRequest.id).label('count')
    ).filter(
        DataRequest.user_id == current_user.id,
        DataRequest.created_at >= week_ago
    ).group_by(func.date(DataRequest.created_at)).all()
    
    return {
        "requests": {
            "total": total_requests,
            "completed": completed_requests,
            "pending": pending_requests,
            "failed": failed_requests,
            "success_rate": (completed_requests / total_requests) * 100 if total_requests > 0 else 0
        },
        "datasets": {
            "total": total_datasets
        },
        "recent_requests": [
            {
                "id": req.id,
                "model_type": req.request_parameters.model_type if req.request_parameters else "Unknown",
                "status": req.status.value,
                "created_at": req.created_at.isoformat(),
                "sample_size": req.request_parameters.sample_size if req.request_parameters else 0
            }
            for req in recent_requests
        ],
        "activity_chart": [
            {
                "date": activity.date.isoformat(),
                "requests": activity.count
            }
            for activity in recent_activity
        ]
    }

@router.get("/system")
async def get_system_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtient les statistiques système (admin seulement)"""
    
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès autorisé aux administrateurs seulement")
    
    # Statistiques globales
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    total_requests = db.query(DataRequest).count()
    completed_requests = db.query(DataRequest).filter(
        DataRequest.status == RequestStatus.COMPLETED
    ).count()
    
    processing_requests = db.query(DataRequest).filter(
        DataRequest.status == RequestStatus.PROCESSING
    ).count()
    
    # Utilisation par modèle
    model_usage = db.query(
        RequestParameters.model_type.label('model_type'),
        func.count(DataRequest.id).label('count')
    ).join(
        RequestParameters, DataRequest.id == RequestParameters.request_id
    ).group_by(RequestParameters.model_type).all()
    
    # Activité des 30 derniers jours
    month_ago = datetime.utcnow() - timedelta(days=30)
    monthly_activity = db.query(
        func.date(DataRequest.created_at).label('date'),
        func.count(DataRequest.id).label('count')
    ).filter(
        DataRequest.created_at >= month_ago
    ).group_by(func.date(DataRequest.created_at)).all()
    
    return {
        "users": {
            "total": total_users,
            "active": active_users
        },
        "requests": {
            "total": total_requests,
            "completed": completed_requests,
            "processing": processing_requests,
            "success_rate": (completed_requests / total_requests) * 100 if total_requests > 0 else 0
        },
        "model_usage": [
            {
                "model_type": usage.model_type or "Unknown",
                "count": usage.count
            }
            for usage in model_usage
        ],
        "monthly_activity": [
            {
                "date": activity.date.isoformat(),
                "requests": activity.count
            }
            for activity in monthly_activity
        ]
    }

@router.get("/performance")
async def get_performance_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtient les statistiques de performance"""
    
    # Temps de génération moyens par modèle
    completed_requests = db.query(DataRequest).filter(
        DataRequest.user_id == current_user.id,
        DataRequest.status == RequestStatus.COMPLETED,
        DataRequest.completed_at.isnot(None)
    ).all()
    
    performance_data = {}
    for request in completed_requests:
        if request.request_parameters and request.request_parameters.model_type:
            model_type = request.request_parameters.model_type
            duration = (request.completed_at - request.created_at).total_seconds()
            
            if model_type not in performance_data:
                performance_data[model_type] = []
            performance_data[model_type].append(duration)
    
    # Calculer les moyennes
    avg_performance = {}
    for model_type, durations in performance_data.items():
        avg_performance[model_type] = {
            "avg_duration": sum(durations) / len(durations),
            "min_duration": min(durations),
            "max_duration": max(durations),
            "count": len(durations)
        }
    
    return {
        "performance_by_model": avg_performance,
        "total_completed": len(completed_requests)
    }

@router.get("/export")
async def export_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exporte toutes les données de l'utilisateur"""
    
    # Récupérer toutes les requêtes
    requests = db.query(DataRequest).filter(
        DataRequest.user_id == current_user.id
    ).all()
    
    # Récupérer tous les datasets
    datasets = db.query(UploadedDataset).filter(
        UploadedDataset.user_id == current_user.id
    ).all()
    
    # Récupérer toutes les notifications
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).all()
    
    return {
        "user_info": {
            "id": current_user.id,
            "email": current_user.email,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        },
        "requests": [
            {
                "id": req.id,
                "status": req.status.value,
                "parameters": {
                    "model_type": req.request_parameters.model_type,
                    "sample_size": req.request_parameters.sample_size,
                    "epochs": req.request_parameters.epochs,
                    "batch_size": req.request_parameters.batch_size
                } if req.request_parameters else None,
                "created_at": req.created_at.isoformat(),
                "completed_at": req.completed_at.isoformat() if req.completed_at else None,
                "error_message": req.error_message
            }
            for req in requests
        ],
        "datasets": [
            {
                "id": dataset.id,
                "filename": dataset.filename,
                "file_size": dataset.file_size,
                "analysis_results": dataset.analysis_results,
                "uploaded_at": dataset.uploaded_at.isoformat()
            }
            for dataset in datasets
        ],
        "notifications": [
            {
                "id": notif.id,
                "type": notif.type.value,
                "message": notif.message,
                "is_read": notif.is_read,
                "created_at": notif.created_at.isoformat()
            }
            for notif in notifications
        ]
    }
