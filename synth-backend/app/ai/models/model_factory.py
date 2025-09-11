from app.ai.models.tvae_wrapper import TVAEWrapper
from app.ai.models.ctgan_wrapper import CTGANWrapper
from app.ai.models.gaussian_copula_wrapper import create_gaussian_copula_model

def get_model_wrapper(model_type: str, hyperparameters: dict):
    """Factory pour créer le wrapper approprié"""
    if model_type.lower() == "tvae":
        return TVAEWrapper(hyperparameters)
    elif model_type.lower() == "ctgan":
        return CTGANWrapper(hyperparameters)
    elif model_type.lower() == "gaussian_copula":
        return create_gaussian_copula_model(hyperparameters)
    else:
        raise ValueError(f"Type de modèle inconnu: {model_type}")