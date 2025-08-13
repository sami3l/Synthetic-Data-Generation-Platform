from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Union, Literal, Any
from datetime import datetime
import json

class ParameterRange(BaseModel):
    """Définit une plage de valeurs pour un paramètre"""
    min_value: Union[int, float]
    max_value: Union[int, float]
    step: Optional[Union[int, float]] = None
    scale: Optional[Literal["linear", "log"]] = "linear"

class CategoricalParameter(BaseModel):
    """Définit des valeurs catégorielles pour un paramètre"""
    choices: List[Any]
    
    @validator('choices')
    def validate_choices(cls, v):
        if not v:
            raise ValueError('choices cannot be empty')
        return v

class SearchSpace(BaseModel):
    """Espace de recherche pour l'optimisation"""
    # CTGAN Parameters
    epochs: Optional[ParameterRange] = None
    batch_size: Optional[CategoricalParameter] = None
    generator_lr: Optional[ParameterRange] = None
    discriminator_lr: Optional[ParameterRange] = None
    generator_decay: Optional[ParameterRange] = None
    discriminator_decay: Optional[ParameterRange] = None
    
    # TVAE Parameters
    compress_dims: Optional[CategoricalParameter] = None
    decompress_dims: Optional[CategoricalParameter] = None
    l2scale: Optional[ParameterRange] = None
    loss_factor: Optional[ParameterRange] = None
    
    # Permettre des paramètres personnalisés
    custom_parameters: Optional[Dict[str, Union[ParameterRange, CategoricalParameter]]] = None

    @classmethod
    def get_default_ctgan_space(cls):
        """Retourne un espace de recherche par défaut pour CTGAN"""
        return cls(
            epochs=ParameterRange(min_value=100, max_value=1000, step=50),
            batch_size=CategoricalParameter(choices=[32, 64, 128, 256, 512]),
            generator_lr=ParameterRange(min_value=1e-5, max_value=1e-2, scale="log"),
            discriminator_lr=ParameterRange(min_value=1e-5, max_value=1e-2, scale="log")
        )
    
    @classmethod
    def get_default_tvae_space(cls):
        """Retourne un espace de recherche par défaut pour TVAE"""
        return cls(
            epochs=ParameterRange(min_value=100, max_value=1000, step=50),
            batch_size=CategoricalParameter(choices=[32, 64, 128, 256, 512]),
            compress_dims=CategoricalParameter(choices=[[128, 128], [256, 128], [512, 256]]),
            decompress_dims=CategoricalParameter(choices=[[128, 128], [128, 256], [256, 512]]),
            l2scale=ParameterRange(min_value=1e-6, max_value=1e-3, scale="log"),
            loss_factor=ParameterRange(min_value=1, max_value=10)
        )

class OptimizationConfig(BaseModel):
    enabled: bool = False
    search_type: Optional[str] = "grid"  # "grid", "random", "bayesian"
    n_trials: Optional[int] = 5
    hyperparameters: Optional[dict] = {}  # Paramètres spécifiques à optimiser

    
class OptimizationConfigCreate(BaseModel):
    request_id: int
    optimization_type: Literal["bayesian", "grid", "random"]
    max_evaluations: int = Field(default=50, ge=5, le=500)
    timeout_minutes: int = Field(default=60, ge=10, le=1440)
    search_space: SearchSpace
    acquisition_function: Optional[Literal["expected_improvement", "upper_confidence_bound", "probability_improvement"]] = "expected_improvement"

class OptimizationConfigOut(BaseModel):
    id: int
    request_id: int
    optimization_type: str
    max_evaluations: int
    timeout_minutes: int
    search_space: Dict
    status: str
    best_score: Optional[float]
    total_evaluations: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class OptimizationTrialOut(BaseModel):
    id: int
    trial_number: int
    parameters: Dict
    quality_score: Optional[float]
    training_time: Optional[float]
    memory_usage: Optional[float]
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True