from app.ai.models.base_wrapper import BaseModelWrapper
from sdv.single_table import CTGANSynthesizer
from sdv.metadata import SingleTableMetadata
import pandas as pd

class CTGANWrapper(BaseModelWrapper):
    def __init__(self, params: dict):
        super().__init__(params)
        self.metadata = SingleTableMetadata()

    async def train(self, data: pd.DataFrame) -> None:
        """Entraîne le modèle CTGAN"""
        try:
            self.metadata.detect_from_dataframe(data)
            self.model = CTGANSynthesizer(
                metadata=self.metadata,
                epochs=self.params.get('epochs', 300),
                batch_size=self.params.get('batch_size', 500)
            )
            self.model.fit(data)
        except Exception as e:
            raise Exception(f"Erreur d'entraînement CTGAN: {str(e)}")

    async def generate(self, num_rows: int) -> pd.DataFrame:
        """Génère des données synthétiques"""
        if not self.model:
            raise Exception("Le modèle doit être entraîné avant la génération")
        return self.model.sample(num_rows=num_rows)

    async def save(self, path: str) -> None:
        if self.model:
            self.model.save(path)

    async def load(self, path: str) -> None:
        self.model = CTGANSynthesizer.load(path)