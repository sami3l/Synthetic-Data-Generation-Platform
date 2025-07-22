import pandas as pd
from sdv.single_table import TVAESynthesizer
from sdv.metadata import SingleTableMetadata
from app.ai.models.base_wrapper import BaseModelWrapper

class TVAEWrapper(BaseModelWrapper):
    def __init__(self, hyperparameters: dict):
        super().__init__(hyperparameters)
        self.metadata = None

    async def train(self, data: pd.DataFrame) -> None:
        self.metadata = SingleTableMetadata()
        self.metadata.detect_from_dataframe(data)
        
        self.model = TVAESynthesizer(
            metadata=self.metadata,
            epochs=self.hyperparameters.get("epochs", 300),
            batch_size=self.hyperparameters.get("batch_size", 500),
            enforce_min_max_values=True,
            enforce_rounding=True
        )
        self.model.fit(data)

    async def generate(self, num_rows: int) -> pd.DataFrame:
        if not self.model:
            raise ValueError("Le modèle doit être entraîné avant la génération")
        return self.model.sample(num_rows=num_rows)