"""
Schémas Pydantic pour la nouvelle API de génération avec optimisation
"""
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime

# === Schémas pour la configuration de génération ===

class GenerationConfigRequest(BaseModel):
    """Configuration de génération envoyée par le frontend"""
    model_config = {"protected_namespaces": ()}
    
    # Paramètres de base
    dataset_id: int = Field(..., description="ID du dataset à utiliser")
    model_type: Literal['ctgan', 'tvae'] = Field(..., description="Type de modèle IA")
    sample_size: int = Field(..., ge=100, le=100000, description="Nombre d'échantillons à générer")
    
    # Mode de génération
    mode: Literal['simple', 'optimization'] = Field(..., description="Mode de génération")
    
    # Paramètres manuels (pour mode simple)
    epochs: Optional[int] = Field(None, ge=50, le=1000, description="Nombre d'époques")
    batch_size: Optional[int] = Field(None, ge=100, le=2000, description="Taille de batch")
    learning_rate: Optional[float] = Field(None, ge=0.00001, le=0.01, description="Taux d'apprentissage")
    generator_lr: Optional[float] = Field(None, ge=0.00001, le=0.01, description="Learning rate du générateur (CTGAN)")
    discriminator_lr: Optional[float] = Field(None, ge=0.00001, le=0.01, description="Learning rate du discriminateur (CTGAN)")
    
    # Configuration d'optimisation (pour mode optimization)
    optimization_method: Optional[Literal['grid', 'random', 'bayesian']] = Field(None, description="Méthode d'optimisation")
    n_trials: Optional[int] = Field(None, ge=3, le=50, description="Nombre d'essais pour l'optimisation")
    hyperparameters: Optional[List[str]] = Field(None, description="Liste des hyperparamètres à optimiser")
    
    @model_validator(mode='after')
    def validate_mode_params(self):
        """Valider les paramètres selon le mode"""
        if self.mode == 'simple':
            if self.epochs is None:
                raise ValueError('epochs est requis en mode simple')
            if self.batch_size is None:
                raise ValueError('batch_size est requis en mode simple')
            if self.learning_rate is None:
                raise ValueError('learning_rate est requis en mode simple')
        
        elif self.mode == 'optimization':
            if self.optimization_method is None:
                raise ValueError('optimization_method est requis en mode optimization')
            if self.hyperparameters is None or len(self.hyperparameters) == 0:
                raise ValueError('Au moins un hyperparamètre doit être sélectionné pour l\'optimisation')
            if self.n_trials is None:
                raise ValueError('n_trials est requis en mode optimization')
        
        return self

class GenerationStartResponse(BaseModel):
    """Réponse lors du démarrage d'une génération"""
    message: str
    request_id: int
    status: str
    mode: str
    estimated_time_minutes: Optional[int] = None

# === Schémas pour le statut et la progression ===

class GenerationProgress(BaseModel):
    """Informations de progression"""
    current_epoch: Optional[int] = None
    total_epochs: Optional[int] = None
    estimated_time_remaining: Optional[str] = None
    current_trial: Optional[int] = None  # Pour l'optimisation
    total_trials: Optional[int] = None   # Pour l'optimisation
    best_score_so_far: Optional[float] = None  # Pour l'optimisation

class GenerationRequestDetails(BaseModel):
    """Détails d'une requête de génération"""
    id: int
    user_id: int
    dataset_id: int
    status: Literal['pending', 'processing', 'completed', 'failed', 'cancelled']
    mode: str
    model_type: str
    sample_size: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    # Résultats
    quality_score: Optional[float] = None
    generation_time: Optional[float] = None
    synthetic_data_path: Optional[str] = None
    
    # Métadonnées d'optimisation
    optimization_results: Optional[Dict[str, Any]] = None
    best_parameters: Optional[Dict[str, Any]] = None

class GenerationStatusResponse(BaseModel):
    """Réponse complète du statut"""
    request: GenerationRequestDetails
    progress: Optional[GenerationProgress] = None
    can_download: bool = False
    can_cancel: bool = False

# === Schémas pour l'optimisation ===

class OptimizationTrial(BaseModel):
    """Détails d'un essai d'optimisation"""
    trial_number: int
    parameters: Dict[str, Any]
    quality_score: Optional[float] = None
    training_time: Optional[float] = None
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None

class OptimizationResults(BaseModel):
    """Résultats d'optimisation"""
    config_id: int
    request_id: int
    method: str
    total_trials: int
    completed_trials: int
    best_score: Optional[float] = None
    best_parameters: Optional[Dict[str, Any]] = None
    all_trials: List[OptimizationTrial] = []

# === Schémas pour le téléchargement ===

class GenerationDownloadResponse(BaseModel):
    """Réponse pour le téléchargement"""
    download_url: str
    expires_at: datetime
    file_size: Optional[int] = None
    file_format: str = "csv"

# === Schémas pour les listes ===

class GenerationRequestSummary(BaseModel):
    """Résumé d'une requête pour les listes"""
    id: int
    request_name: Optional[str] = None
    dataset_name: str
    model_type: str
    sample_size: int
    status: str
    mode: str
    quality_score: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

class GenerationRequestListResponse(BaseModel):
    """Liste des requêtes de génération"""
    requests: List[GenerationRequestSummary]
    total: int
    page: int = 1
    page_size: int = 50

# === Schémas d'erreur ===

class GenerationError(BaseModel):
    """Erreur de génération"""
    error_code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    request_id: Optional[int] = None
