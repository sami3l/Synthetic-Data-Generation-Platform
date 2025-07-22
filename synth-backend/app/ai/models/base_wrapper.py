from abc import ABC, abstractmethod
import pandas as pd

class BaseModelWrapper(ABC):
    def __init__(self, hyperparameters: dict):
        self.hyperparameters = hyperparameters
        self.model = None

    @abstractmethod
    async def train(self, data: pd.DataFrame) -> None:
        pass

    @abstractmethod
    async def generate(self, num_rows: int) -> pd.DataFrame:
        pass