
from sdv.single_table import CTGANSynthesizer
from sdv.metadata import SingleTableMetadata
import pandas as pd
import logging

logger = logging.getLogger(__name__)

class BaseModelWrapper:
    """Base class for all model wrappers"""
    
    def __init__(self, params: dict):
        """Initialize the base model wrapper with parameters"""
        self.params = params if params is not None else {}
        self.model = None
        logger.info(f"Initialized {self.__class__.__name__} with params: {self.params}")
    
    async def train(self, data: pd.DataFrame) -> None:
        """Train the model - to be implemented by subclasses"""
        raise NotImplementedError("Subclasses must implement train method")
    
    async def generate(self, num_rows: int) -> pd.DataFrame:
        """Generate synthetic data - to be implemented by subclasses"""
        raise NotImplementedError("Subclasses must implement generate method")
    
    async def save(self, path: str) -> None:
        """Save the model - to be implemented by subclasses"""
        raise NotImplementedError("Subclasses must implement save method")
    
    async def load(self, path: str) -> None:
        """Load the model - to be implemented by subclasses"""
        raise NotImplementedError("Subclasses must implement load method")
