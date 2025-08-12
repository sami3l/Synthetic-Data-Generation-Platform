from app.ai.models.base_wrapper import BaseModelWrapper
from sdv.single_table import CTGANSynthesizer
from sdv.metadata import SingleTableMetadata
import pandas as pd

import logging

logger = logging.getLogger(__name__)

class CTGANWrapper(BaseModelWrapper):
    def __init__(self, params: dict):
        super().__init__(params)
        self.metadata = SingleTableMetadata()
        logger.info(f"CTGANWrapper initialized with params: {self.params}")

    async def train(self, data: pd.DataFrame) -> None:
        """Train the CTGAN model"""
        try:
            logger.info(f"Starting CTGAN training with {len(data)} rows")
            
            # Detect metadata from the dataframe
            self.metadata.detect_from_dataframe(data)
            logger.info("Metadata detected successfully")
            
            # Extract parameters with defaults
            epochs = self.params.get('epochs', 300)
            batch_size = self.params.get('batch_size', 500)
            learning_rate = self.params.get('learning_rate', 2e-4)
            
            logger.info(f"Training CTGAN with epochs={epochs}, batch_size={batch_size}, lr={learning_rate}")
            
            # Initialize the CTGAN synthesizer
            # Note: learning_rate might be passed as generator_lr and discriminator_lr in some versions
            ctgan_params = {
                'metadata': self.metadata,
                'epochs': epochs,
                'batch_size': batch_size,
                'verbose': True  # Enable verbose logging
            }
            
            # Add learning rate if supported by the CTGAN version
            try:
                # Try different parameter names that might be used for learning rate
                if 'generator_lr' in CTGANSynthesizer.__init__.__code__.co_varnames:
                    ctgan_params['generator_lr'] = learning_rate
                    ctgan_params['discriminator_lr'] = learning_rate
                elif 'learning_rate' in CTGANSynthesizer.__init__.__code__.co_varnames:
                    ctgan_params['learning_rate'] = learning_rate
            except Exception as e:
                logger.warning(f"Could not set learning rate parameter: {e}")
            
            self.model = CTGANSynthesizer(**ctgan_params)
            
            # Fit the model
            logger.info("Starting model fitting...")
            self.model.fit(data)
            logger.info("CTGAN training completed successfully")
            
        except Exception as e:
            error_msg = f"CTGAN training error: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    async def generate(self, num_rows: int) -> pd.DataFrame:
        """Generate synthetic data"""
        if not self.model:
            raise Exception("Model must be trained before generation")
        
        try:
            logger.info(f"Generating {num_rows} synthetic rows")
            synthetic_data = self.model.sample(num_rows=num_rows)
            logger.info(f"Successfully generated {len(synthetic_data)} rows")
            return synthetic_data
        except Exception as e:
            error_msg = f"CTGAN generation error: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    async def save(self, path: str) -> None:
        """Save the trained model"""
        if not self.model:
            raise Exception("No model to save")
        
        try:
            logger.info(f"Saving CTGAN model to {path}")
            self.model.save(path)
            logger.info("Model saved successfully")
        except Exception as e:
            error_msg = f"CTGAN save error: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    async def load(self, path: str) -> None:
        """Load a pre-trained model"""
        try:
            logger.info(f"Loading CTGAN model from {path}")
            self.model = CTGANSynthesizer.load(path)
            logger.info("Model loaded successfully")
        except Exception as e:
            error_msg = f"CTGAN load error: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    def get_model_info(self) -> dict:
        """Get information about the current model"""
        return {
            "model_type": "CTGAN",
            "is_trained": self.model is not None,
            "parameters": self.params,
            "metadata_columns": list(self.metadata.columns.keys()) if self.metadata else []
        }