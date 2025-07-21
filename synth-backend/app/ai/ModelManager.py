from app.models.ctgan_model import CTGANModel
from app.models.tvae_model import TVAEModel

class ModelManager:

    @staticmethod
    def get_model(model_type: str):
        if model_type.lower() == "ctgan":
            return CTGANModel()
        elif model_type.lower() == "tvae":
            return TVAEModel()
        else:
            raise ValueError(f"Unknown model type: {model_type}")