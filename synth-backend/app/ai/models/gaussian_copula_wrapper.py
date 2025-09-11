"""
Wrapper pour le modèle Gaussian Copula de SDV
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List
from sdv.single_table import GaussianCopulaSynthesizer
from sdv.metadata import SingleTableMetadata
import logging
from app.ai.models.base_wrapper import BaseModelWrapper

logger = logging.getLogger(__name__)

class GaussianCopulaWrapper(BaseModelWrapper):
    """
    Wrapper pour simplifier l'utilisation du GaussianCopulaSynthesizer de SDV
    """
    
    def __init__(self, params: dict):
        """
        Initialise le wrapper Gaussian Copula
        
        Args:
            params: Dictionnaire des paramètres contenant:
                - distribution: Type de distribution pour les variables numériques
                - categorical_transformer: Méthode de transformation pour les colonnes catégorielles
                - default_distribution: Distribution de fallback si l'estimation échoue
        """
        super().__init__(params)
        
        # Extraction des paramètres avec valeurs par défaut
        self.distribution = params.get('distribution', 'parametric')
        self.categorical_transformer = params.get('categorical_transformer', 'one_hot')
        self.default_distribution = params.get('default_distribution', 'norm')
        
        self.metadata = None
        self.is_fitted = False
        
        logger.info(f"Initialisation GaussianCopula avec distribution={self.distribution}, "
                   f"categorical_transformer={self.categorical_transformer}, "
                   f"default_distribution={self.default_distribution}")
    
    def prepare_metadata(self, data: pd.DataFrame) -> SingleTableMetadata:
        """
        Prépare les métadonnées pour le dataset
        
        Args:
            data: DataFrame contenant les données d'entraînement
            
        Returns:
            SingleTableMetadata: Métadonnées préparées
        """
        try:
            # Détection automatique des métadonnées
            metadata = SingleTableMetadata()
            metadata.detect_from_dataframe(data)
            
            # Configuration avancée selon les paramètres
            for column_name, column_info in metadata.columns.items():
                if column_info['sdtype'] == 'numerical':
                    # Configuration pour les colonnes numériques
                    if self.distribution == 'bounded':
                        metadata.update_column(column_name, computer_representation='Float')
                    elif self.distribution == 'truncated':
                        # Pour les distributions tronquées, on peut ajouter des contraintes
                        col_min = data[column_name].min()
                        col_max = data[column_name].max()
                        logger.info(f"Colonne {column_name}: min={col_min}, max={col_max}")
                
                elif column_info['sdtype'] == 'categorical':
                    # Configuration pour les colonnes catégorielles
                    if self.categorical_transformer == 'categorical':
                        metadata.update_column(column_name, computer_representation='Int8')
            
            logger.info(f"Métadonnées préparées pour {len(metadata.columns)} colonnes")
            return metadata
            
        except Exception as e:
            logger.error(f"Erreur lors de la préparation des métadonnées: {e}")
            raise
    
    async def train(self, data: pd.DataFrame) -> None:
        """
        Entraîne le modèle Gaussian Copula
        
        Args:
            data: DataFrame contenant les données d'entraînement
        """
        try:
            logger.info(f"Début de l'entraînement sur {len(data)} échantillons")
            
            # Préparation des métadonnées
            self.metadata = self.prepare_metadata(data)
            
            # Configuration du modèle selon les paramètres
            model_config = {
                'metadata': self.metadata,
                'default_distribution': self.default_distribution
            }
            
            # Configuration spécifique selon le type de distribution
            if self.distribution == 'parametric':
                model_config['enforce_min_max_values'] = True
            elif self.distribution == 'bounded':
                model_config['enforce_min_max_values'] = True
                model_config['enforce_rounding'] = True
            elif self.distribution == 'truncated':
                model_config['enforce_min_max_values'] = True
                model_config['enforce_rounding'] = False
            
            # Initialisation du modèle
            self.model = GaussianCopulaSynthesizer(**model_config)
            
            # Entraînement
            self.model.fit(data)
            self.is_fitted = True
            
            logger.info("Entraînement terminé avec succès")
            
        except Exception as e:
            error_msg = f"Erreur lors de l'entraînement: {e}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
    
    async def generate(self, num_rows: int) -> pd.DataFrame:
        """
        Génère des échantillons synthétiques
        
        Args:
            num_rows: Nombre d'échantillons à générer
            
        Returns:
            pd.DataFrame: Données synthétiques générées
        """
        if not self.is_fitted:
            raise ValueError("Le modèle doit être entraîné avant de générer des échantillons")
        
        try:
            logger.info(f"Génération de {num_rows} échantillons synthétiques")
            
            synthetic_data = self.model.sample(num_rows)
            
            logger.info(f"Génération terminée: {len(synthetic_data)} échantillons créés")
            return synthetic_data
            
        except Exception as e:
            error_msg = f"Erreur lors de la génération: {e}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
    
    async def save(self, path: str) -> None:
        """
        Sauvegarde le modèle entraîné
        
        Args:
            path: Chemin vers le fichier de sauvegarde
        """
        if not self.is_fitted:
            raise ValueError("Le modèle doit être entraîné avant d'être sauvegardé")
        
        try:
            self.model.save(path)
            logger.info(f"Modèle sauvegardé dans {path}")
        except Exception as e:
            error_msg = f"Erreur lors de la sauvegarde: {e}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
    
    async def load(self, path: str) -> None:
        """
        Charge un modèle depuis un fichier
        
        Args:
            path: Chemin vers le fichier du modèle
        """
        try:
            self.model = GaussianCopulaSynthesizer.load(path)
            self.is_fitted = True
            logger.info(f"Modèle chargé depuis {path}")
        except Exception as e:
            error_msg = f"Erreur lors du chargement: {e}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Retourne des informations sur le modèle
        
        Returns:
            Dict contenant les informations du modèle
        """
        return {
            'model_type': 'gaussian_copula',
            'distribution': self.distribution,
            'categorical_transformer': self.categorical_transformer,
            'default_distribution': self.default_distribution,
            'is_fitted': self.is_fitted,
            'metadata_columns': len(self.metadata.columns) if self.metadata else 0
        }


def create_gaussian_copula_model(hyperparameters: Dict[str, Any]) -> GaussianCopulaWrapper:
    """
    Factory function pour créer un modèle Gaussian Copula avec des hyperparamètres
    
    Args:
        hyperparameters: Dictionnaire des hyperparamètres
        
    Returns:
        GaussianCopulaWrapper: Instance configurée du modèle
    """
    logger.info(f"Création d'un modèle Gaussian Copula avec hyperparamètres: {hyperparameters}")
    
    return GaussianCopulaWrapper(hyperparameters)
