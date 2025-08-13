import pandas as pd
import logging
from typing import Optional, Dict, Any
from sdv.single_table import TVAESynthesizer
from sdv.metadata import SingleTableMetadata
from app.ai.models.base_wrapper import BaseModelWrapper

logger = logging.getLogger(__name__)

class TVAEWrapper(BaseModelWrapper):
    def __init__(self, hyperparameters: Optional[Dict[str, Any]] = None):
        super().__init__(hyperparameters or {})
        self.metadata = None
        logger.info(f"TVAEWrapper initialized with params: {self.params}")

    async def train(self, data: pd.DataFrame) -> None:
        """Train the TVAE model"""
        try:
            logger.info(f"Starting TVAE training with {len(data)} rows")
            
            # Detect metadata from the dataframe
            self.metadata = SingleTableMetadata()
            self.metadata.detect_from_dataframe(data)
            logger.info("Metadata detected successfully")
            
            # Extract parameters with defaults
            epochs = self.params.get("epochs", 300)
            batch_size = self.params.get("batch_size", 500)
            learning_rate = self.params.get("learning_rate", 2e-4)
            
            logger.info(f"Training TVAE with epochs={epochs}, batch_size={batch_size}, lr={learning_rate}")
            
            # Initialize the TVAE synthesizer with parameters
            tvae_params = {
                'metadata': self.metadata,
                'epochs': epochs,
                'batch_size': batch_size,
                'enforce_min_max_values': True,
                'enforce_rounding': True,
                'verbose': True  # Enable verbose logging
            }
            
            # Add learning rate if supported by the TVAE version
            try:
                if 'learning_rate' in TVAESynthesizer.__init__.__code__.co_varnames:
                    tvae_params['learning_rate'] = learning_rate
            except Exception as e:
                logger.warning(f"Could not set learning rate parameter: {e}")
            
            self.model = TVAESynthesizer(**tvae_params)
            
            # Fit the model
            logger.info("Starting model fitting...")
            self.model.fit(data)
            logger.info("TVAE training completed successfully")
            
        except Exception as e:
            error_msg = f"TVAE training error: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    async def generate(self, num_rows: int) -> pd.DataFrame:
        """Generate synthetic data"""
        if not self.model:
            error_msg = "Model must be trained before generation"
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        try:
            logger.info(f"Generating {num_rows} synthetic rows")
            synthetic_data = self.model.sample(num_rows=num_rows)
            logger.info(f"Successfully generated {len(synthetic_data)} rows")
            return synthetic_data
        except Exception as e:
            error_msg = f"TVAE generation error: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    async def save(self, path: str) -> None:
        """Save the trained model"""
        if not self.model:
            raise Exception("No model to save")
        
        try:
            logger.info(f"Saving TVAE model to {path}")
            self.model.save(path)
            logger.info("Model saved successfully")
        except Exception as e:
            error_msg = f"TVAE save error: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    async def load(self, path: str) -> None:
        """Load a pre-trained model"""
        try:
            logger.info(f"Loading TVAE model from {path}")
            self.model = TVAESynthesizer.load(path)
            logger.info("Model loaded successfully")
        except Exception as e:
            error_msg = f"TVAE load error: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    def get_model_info(self) -> dict:
        """Get information about the current model"""
        return {
            "model_type": "TVAE",
            "is_trained": self.model is not None,
            "parameters": self.params,
            "metadata_columns": list(self.metadata.columns.keys()) if self.metadata else []
        }