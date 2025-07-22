from app.ai.models.tvae_wrapper import TVAEWrapper
from app.ai.models.ctgan_wrapper import CTGANWrapper

def get_model_wrapper(model_type: str, hyperparameters: dict):
    """Factory pour créer le wrapper approprié"""
    if model_type.lower() == "tvae":
        return TVAEWrapper(hyperparameters)
    elif model_type.lower() == "ctgan":
        return CTGANWrapper(hyperparameters)
    else:
        raise ValueError(f"Type de modèle inconnu: {model_type}")