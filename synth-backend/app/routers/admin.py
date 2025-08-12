from app.models import DataRequest, RequestParameters
from app.schemas.DataRequest import DataRequestOut
from datetime import datetime


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.dependencies.auth import get_current_user

from app.schemas.user import UserCreate, UserLogin, UserResponse, UserUpdateRole, UserUpdateActive
from app.schemas.user_profile import UserProfileResponse
from app.schemas.admin_action_log import AdminActionLogResponse
from app.models import AdminActionLog, UserProfile
from app.auth import jwt
from passlib.context import CryptContext
from app.dependencies.roles import require_role


router = APIRouter(prefix="/admin", tags=["Administration"])

# Liste des utilisateurs avec pagination et recherche
@router.get("/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
    skip: int = 0,
    limit: int = 20,
    search: str = "",
    role: str = ""
):
    query = db.query(User)
    if search:
        query = query.filter((User.email.ilike(f"%{search}%")) | (User.username.ilike(f"%{search}%")))
    if role:
        query = query.filter(User.role == role)
    users = query.offset(skip).limit(limit).all()
    return users

# Activer/désactiver un utilisateur (avec log)
@router.patch("/users/{user_id}/active", response_model=UserResponse)
def set_user_active(user_id: int, data: UserUpdateActive, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    # Log action
    log = AdminActionLog(admin_id=current_user.id, action="set_active", target_user_id=user.id, details=f"is_active={data.is_active}")
    db.add(log)
    db.commit()
    return user

# Changer le rôle d'un utilisateur (avec log)
@router.patch("/users/{user_id}/role", response_model=UserResponse)
def set_user_role(user_id: int, data: UserUpdateRole, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = data.role
    db.commit()
    db.refresh(user)
    # Log action
    log = AdminActionLog(admin_id=current_user.id, action="set_role", target_user_id=user.id, details=f"role={data.role}")
    db.add(log)
    db.commit()
    return user

# Supprimer un utilisateur (avec log)
@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Log action AVANT la suppression
    log = AdminActionLog(admin_id=current_user.id, action="delete_user", target_user_id=user_id, details=None)
    db.add(log)
    db.commit()
    
    # Supprimer l'utilisateur
    db.delete(user)
    db.commit()
    return None

# Endpoint pour voir le détail complet d'un utilisateur (profil inclus)
@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_detail(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Endpoint pour voir le profil utilisateur
@router.get("/users/{user_id}/profile", response_model=UserProfileResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    # Vérifier que l'utilisateur existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Chercher le profil existant
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    # Si le profil n'existe pas, créer un profil par défaut
    if not profile:
        profile = UserProfile(
            user_id=user_id,
            full_name=user.email,  # Utiliser l'email comme nom par défaut
            organization=None,
            usage_purpose=None,
            role="user"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    return profile

# Endpoint pour l'historique d'activité admin
@router.get("/admin-action-logs", response_model=list[AdminActionLogResponse])
def get_admin_action_logs(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin")), skip: int = 0, limit: int = 50):
    logs = db.query(AdminActionLog).order_by(AdminActionLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs
# Liste paginée/recherchable des requêtes
@router.get("/requests", response_model=list[DataRequestOut])
def list_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
    skip: int = 0,
    limit: int = 20,
    search: str = "",
    status: str = ""
):
    query = db.query(DataRequest)
    if search:
        query = query.filter((DataRequest.request_name.ilike(f"%{search}%")) | (DataRequest.dataset_name.ilike(f"%{search}%")))
    if status:
        query = query.filter(DataRequest.status == status)
    requests = query.order_by(DataRequest.created_at.desc()).offset(skip).limit(limit).all()
    return requests

# Détail d'une requête
@router.get("/requests/{request_id}", response_model=DataRequestOut)
def get_request_detail(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    req = db.query(DataRequest).filter(DataRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requête non trouvée")
    return req

# Approuver une requête 
@router.put("/requests/{request_id}/approve", response_model=DataRequestOut)
def admin_approve_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    req = db.query(DataRequest).filter(DataRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requête non trouvée")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Seules les requêtes en attente peuvent être approuvées")
    req.status = "approved"
    req.approved_by = current_user.id
    req.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(req)
    # Log action
    log = AdminActionLog(admin_id=current_user.id, action="approve_request", target_user_id=req.user_id, details=f"request_id={req.id}")
    db.add(log)
    db.commit()
    return req

# Rejeter une requête 
@router.put("/requests/{request_id}/reject", response_model=DataRequestOut)
def admin_reject_request(request_id: int, rejection_reason: str, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    req = db.query(DataRequest).filter(DataRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requête non trouvée")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Seules les requêtes en attente peuvent être rejetées")
    req.status = "rejected"
    req.approved_by = current_user.id
    req.approved_at = datetime.utcnow()
    req.rejection_reason = rejection_reason
    db.commit()
    db.refresh(req)
    # Log action
    log = AdminActionLog(admin_id=current_user.id, action="reject_request", target_user_id=req.user_id, details=f"request_id={req.id};reason={rejection_reason}")
    db.add(log)
    db.commit()
    return req

# Supprimer une requête 
@router.delete("/requests/{request_id}", status_code=204)
def delete_request(request_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    req = db.query(DataRequest).filter(DataRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requête non trouvée")
    
    # Log action avant suppression
    log = AdminActionLog(admin_id=current_user.id, action="delete_request", target_user_id=req.user_id, details=f"request_id={req.id};name={req.request_name}")
    db.add(log)
    
    # Supprimer la requête
    db.delete(req)
    db.commit()