"""
Service de génération de données synthétiques
Supporte CTGAN, TVAE et l'optimisation bayésienne
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
import os
import json
import time
from datetime import datetime
import logging

# SDV imports
from sdv.single_table import CTGANSynthesizer, TVAESynthesizer
from sdv.metadata import SingleTableMetadata
from sdv.evaluation.single_table import evaluate_quality

# Optimisation
from sklearn.model_selection import ParameterGrid
from skopt import gp_minimize
from skopt.space import Real, Integer, Categorical
from skopt.utils import use_named_args

logger = logging.getLogger(__name__)


class SyntheticDataGenerationService:
    
    def __init__(self):
        self.supported_models = ['ctgan', 'tvae', 'bayesian']
        self.default_params = {
            'ctgan': {
                'epochs': 300,
                'batch_size': 500,
                'generator_lr': 2e-4,
                'discriminator_lr': 2e-4,
                'generator_decay': 1e-6,
                'discriminator_decay': 1e-6,
            },
            'tvae': {
                'epochs': 300,
                'batch_size': 500,
                'learning_rate': 1e-3,
                'compress_dims': (128, 128),
                'decompress_dims': (128, 128),
            }
        }
    
    async def generate_synthetic_data(
        self,
        dataset_path: str,
        model_type: str,
        n_samples: int,
        parameters: Dict[str, Any],
        optimization_config: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Génère des données synthétiques avec le modèle spécifié
        """
        try:
            start_time = time.time()
            
            # Charger les données
            if progress_callback:
                progress_callback(10, "Chargement des données...")
            
            df = self._load_dataset(dataset_path)
            metadata = SingleTableMetadata()
            metadata.detect_from_dataframe(df)
            
            # Optimisation des hyperparamètres si demandée
            if optimization_config and optimization_config.get('enabled', False):
                if progress_callback:
                    progress_callback(20, "Optimisation des hyperparamètres...")
                
                best_params, best_score = await self._optimize_hyperparameters(
                    df, metadata, model_type, optimization_config, progress_callback
                )
                parameters.update(best_params)
            else:
                best_score = None
            
            # Entraînement du modèle
            if progress_callback:
                progress_callback(50, f"Entraînement du modèle {model_type.upper()}...")
            
            model = self._create_model(model_type, parameters)
            model.fit(df)
            
            # Génération des données synthétiques
            if progress_callback:
                progress_callback(80, f"Génération de {n_samples} échantillons...")
            
            synthetic_data = model.sample(n_samples)
            
            # Évaluation de la qualité
            if progress_callback:
                progress_callback(90, "Évaluation de la qualité...")
            
            quality_score = self._evaluate_quality(df, synthetic_data, metadata)
            
            generation_time = time.time() - start_time
            
            if progress_callback:
                progress_callback(100, "Génération terminée!")
            
            return {
                'synthetic_data': synthetic_data,
                'quality_score': quality_score,
                'best_parameters': parameters,
                'optimization_score': best_score,
                'generation_time': generation_time,
                'model_type': model_type,
                'n_samples': n_samples
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération: {str(e)}")
            raise Exception(f"Échec de la génération: {str(e)}")
    
    def _load_dataset(self, dataset_path: str) -> pd.DataFrame:
        """Charge un dataset selon son extension"""
        ext = os.path.splitext(dataset_path)[1].lower()
        
        if ext == '.csv':
            return pd.read_csv(dataset_path)
        elif ext == '.json':
            return pd.read_json(dataset_path)
        elif ext == '.xlsx':
            return pd.read_excel(dataset_path)
        elif ext == '.parquet':
            return pd.read_parquet(dataset_path)
        else:
            raise ValueError(f"Format de fichier non supporté: {ext}")
    
    def _create_model(self, model_type: str, parameters: Dict[str, Any]):
        """Crée une instance du modèle avec les paramètres spécifiés"""
        if model_type == 'ctgan':
            return CTGANSynthesizer(
                epochs=parameters.get('epochs', 300),
                batch_size=parameters.get('batch_size', 500),
                generator_lr=parameters.get('generator_lr', 2e-4),
                discriminator_lr=parameters.get('discriminator_lr', 2e-4),
                generator_decay=parameters.get('generator_decay', 1e-6),
                discriminator_decay=parameters.get('discriminator_decay', 1e-6),
                verbose=True
            )
        elif model_type == 'tvae':
            return TVAESynthesizer(
                epochs=parameters.get('epochs', 300),
                batch_size=parameters.get('batch_size', 500),
                learning_rate=parameters.get('learning_rate', 1e-3),
                compress_dims=parameters.get('compress_dims', (128, 128)),
                decompress_dims=parameters.get('decompress_dims', (128, 128)),
                verbose=True
            )
        else:
            raise ValueError(f"Modèle non supporté: {model_type}")
    
    async def _optimize_hyperparameters(
        self,
        df: pd.DataFrame,
        metadata: SingleTableMetadata,
        model_type: str,
        optimization_config: Dict[str, Any],
        progress_callback: Optional[callable] = None
    ) -> Tuple[Dict[str, Any], float]:
        """
        Optimise les hyperparamètres selon la méthode spécifiée
        """
        search_type = optimization_config.get('search_type', 'grid')
        n_trials = optimization_config.get('n_trials', 5)
        hyperparameters = optimization_config.get('hyperparameters', [])
        
        if search_type == 'grid':
            return await self._grid_search(df, metadata, model_type, hyperparameters, progress_callback)
        elif search_type == 'random':
            return await self._random_search(df, metadata, model_type, hyperparameters, n_trials, progress_callback)
        elif search_type == 'bayesian':
            return await self._bayesian_optimization(df, metadata, model_type, hyperparameters, n_trials, progress_callback)
        else:
            raise ValueError(f"Méthode d'optimisation non supportée: {search_type}")
    
    async def _grid_search(
        self,
        df: pd.DataFrame,
        metadata: SingleTableMetadata,
        model_type: str,
        hyperparameters: List[str],
        progress_callback: Optional[callable] = None
    ) -> Tuple[Dict[str, Any], float]:
        """Recherche par grille des meilleurs hyperparamètres"""
        
        # Définir l'espace de recherche
        param_grid = self._get_param_grid(model_type, hyperparameters)
        
        best_params = None
        best_score = 0
        total_combinations = len(list(ParameterGrid(param_grid)))
        
        for i, params in enumerate(ParameterGrid(param_grid)):
            try:
                # Entraîner le modèle avec ces paramètres
                model = self._create_model(model_type, params)
                model.fit(df)
                
                # Générer un échantillon pour évaluation
                synthetic_sample = model.sample(min(1000, len(df)))
                score = self._evaluate_quality(df, synthetic_sample, metadata)
                
                if score > best_score:
                    best_score = score
                    best_params = params.copy()
                
                if progress_callback:
                    progress = 20 + (i / total_combinations) * 25  # 20-45% pour grid search
                    progress_callback(progress, f"Grid Search: {i+1}/{total_combinations}")
                    
            except Exception as e:
                logger.warning(f"Échec de l'évaluation pour les paramètres {params}: {e}")
                continue
        
        return best_params or self.default_params[model_type], best_score
    
    async def _random_search(
        self,
        df: pd.DataFrame,
        metadata: SingleTableMetadata,
        model_type: str,
        hyperparameters: List[str],
        n_trials: int,
        progress_callback: Optional[callable] = None
    ) -> Tuple[Dict[str, Any], float]:
        """Recherche aléatoire des meilleurs hyperparamètres"""
        
        # Définir l'espace de recherche
        param_space = self._get_param_space(model_type, hyperparameters)
        
        best_params = None
        best_score = 0
        
        for i in range(n_trials):
            try:
                # Échantillonner aléatoirement des paramètres
                params = self._sample_random_params(param_space)
                
                # Entraîner le modèle
                model = self._create_model(model_type, params)
                model.fit(df)
                
                # Évaluer
                synthetic_sample = model.sample(min(1000, len(df)))
                score = self._evaluate_quality(df, synthetic_sample, metadata)
                
                if score > best_score:
                    best_score = score
                    best_params = params.copy()
                
                if progress_callback:
                    progress = 20 + (i / n_trials) * 25  # 20-45% pour random search
                    progress_callback(progress, f"Random Search: {i+1}/{n_trials}")
                    
            except Exception as e:
                logger.warning(f"Échec de l'évaluation pour les paramètres {params}: {e}")
                continue
        
        return best_params or self.default_params[model_type], best_score
    
    async def _bayesian_optimization(
        self,
        df: pd.DataFrame,
        metadata: SingleTableMetadata,
        model_type: str,
        hyperparameters: List[str],
        n_trials: int,
        progress_callback: Optional[callable] = None
    ) -> Tuple[Dict[str, Any], float]:
        """Optimisation bayésienne des hyperparamètres"""
        
        # Définir l'espace de recherche pour scikit-optimize
        dimensions = self._get_skopt_dimensions(model_type, hyperparameters)
        param_names = list(dimensions.keys())
        dimension_list = list(dimensions.values())
        
        best_params = None
        best_score = 0
        trial_count = 0
        
        @use_named_args(dimension_list)
        def objective(**params):
            nonlocal best_params, best_score, trial_count
            trial_count += 1
            
            try:
                # Créer et entraîner le modèle
                model = self._create_model(model_type, params)
                model.fit(df)
                
                # Évaluer
                synthetic_sample = model.sample(min(1000, len(df)))
                score = self._evaluate_quality(df, synthetic_sample, metadata)
                
                if score > best_score:
                    best_score = score
                    best_params = params.copy()
                
                if progress_callback:
                    progress = 20 + (trial_count / n_trials) * 25
                    progress_callback(progress, f"Bayesian Optimization: {trial_count}/{n_trials}")
                
                # Retourner l'inverse du score (minimisation)
                return -score
                
            except Exception as e:
                logger.warning(f"Échec de l'évaluation pour les paramètres {params}: {e}")
                return 0  # Score neutre en cas d'échec
        
        # Lancer l'optimisation bayésienne
        result = gp_minimize(
            func=objective,
            dimensions=dimension_list,
            n_calls=n_trials,
            random_state=42
        )
        
        return best_params or self.default_params[model_type], best_score
    
    def _get_param_grid(self, model_type: str, hyperparameters: List[str]) -> Dict[str, List]:
        """Définit la grille de paramètres pour la recherche par grille"""
        if model_type == 'ctgan':
            grid = {}
            if 'epochs' in hyperparameters:
                grid['epochs'] = [100, 300, 500]
            if 'batch_size' in hyperparameters:
                grid['batch_size'] = [250, 500, 1000]
            if 'generator_lr' in hyperparameters:
                grid['generator_lr'] = [1e-4, 2e-4, 5e-4]
            if 'discriminator_lr' in hyperparameters:
                grid['discriminator_lr'] = [1e-4, 2e-4, 5e-4]
        
        elif model_type == 'tvae':
            grid = {}
            if 'epochs' in hyperparameters:
                grid['epochs'] = [100, 300, 500]
            if 'batch_size' in hyperparameters:
                grid['batch_size'] = [250, 500, 1000]
            if 'learning_rate' in hyperparameters:
                grid['learning_rate'] = [5e-4, 1e-3, 2e-3]
        
        return grid if grid else {'epochs': [300]}  # Paramètre par défaut
    
    def _get_skopt_dimensions(self, model_type: str, hyperparameters: List[str]) -> Dict[str, Any]:
        """Définit les dimensions pour l'optimisation bayésienne"""
        dimensions = {}
        
        if model_type == 'ctgan':
            if 'epochs' in hyperparameters:
                dimensions['epochs'] = Integer(50, 1000, name='epochs')
            if 'batch_size' in hyperparameters:
                dimensions['batch_size'] = Categorical([250, 500, 1000], name='batch_size')
            if 'generator_lr' in hyperparameters:
                dimensions['generator_lr'] = Real(1e-5, 1e-3, prior='log-uniform', name='generator_lr')
            if 'discriminator_lr' in hyperparameters:
                dimensions['discriminator_lr'] = Real(1e-5, 1e-3, prior='log-uniform', name='discriminator_lr')
        
        elif model_type == 'tvae':
            if 'epochs' in hyperparameters:
                dimensions['epochs'] = Integer(50, 1000, name='epochs')
            if 'batch_size' in hyperparameters:
                dimensions['batch_size'] = Categorical([250, 500, 1000], name='batch_size')
            if 'learning_rate' in hyperparameters:
                dimensions['learning_rate'] = Real(1e-4, 1e-2, prior='log-uniform', name='learning_rate')
        
        return dimensions if dimensions else {'epochs': Integer(50, 1000, name='epochs')}
    
    def _sample_random_params(self, param_space: Dict[str, Any]) -> Dict[str, Any]:
        """Échantillonne aléatoirement des paramètres"""
        params = {}
        for param_name, param_range in param_space.items():
            if isinstance(param_range, list):
                params[param_name] = np.random.choice(param_range)
            elif isinstance(param_range, tuple) and len(param_range) == 2:
                if isinstance(param_range[0], int):
                    params[param_name] = np.random.randint(param_range[0], param_range[1])
                else:
                    params[param_name] = np.random.uniform(param_range[0], param_range[1])
        return params
    
    def _get_param_space(self, model_type: str, hyperparameters: List[str]) -> Dict[str, Any]:
        """Définit l'espace de paramètres pour la recherche aléatoire"""
        if model_type == 'ctgan':
            space = {}
            if 'epochs' in hyperparameters:
                space['epochs'] = (50, 1000)
            if 'batch_size' in hyperparameters:
                space['batch_size'] = [250, 500, 1000]
            if 'generator_lr' in hyperparameters:
                space['generator_lr'] = (1e-5, 1e-3)
            if 'discriminator_lr' in hyperparameters:
                space['discriminator_lr'] = (1e-5, 1e-3)
        
        elif model_type == 'tvae':
            space = {}
            if 'epochs' in hyperparameters:
                space['epochs'] = (50, 1000)
            if 'batch_size' in hyperparameters:
                space['batch_size'] = [250, 500, 1000]
            if 'learning_rate' in hyperparameters:
                space['learning_rate'] = (1e-4, 1e-2)
        
        return space if space else {'epochs': (50, 1000)}
    
    def _evaluate_quality(
        self,
        real_data: pd.DataFrame,
        synthetic_data: pd.DataFrame,
        metadata: SingleTableMetadata
    ) -> float:
        """Évalue la qualité des données synthétiques"""
        try:
            # Utiliser SDMetrics pour évaluer la qualité
            quality_report = evaluate_quality(
                real_data, 
                synthetic_data, 
                metadata
            )
            
            # Retourner le score global (0-1)
            return quality_report.get_score()
            
        except Exception as e:
            logger.warning(f"Erreur lors de l'évaluation de la qualité: {e}")
            return 0.5  # Score par défaut en cas d'erreur
    
    def save_synthetic_data(
        self,
        synthetic_data: pd.DataFrame,
        output_path: str,
        format: str = 'csv'
    ) -> str:
        """Sauvegarde les données synthétiques dans le format spécifié"""
        try:
            if format.lower() == 'csv':
                synthetic_data.to_csv(output_path, index=False)
            elif format.lower() == 'json':
                synthetic_data.to_json(output_path, orient='records', indent=2)
            elif format.lower() == 'parquet':
                synthetic_data.to_parquet(output_path, index=False)
            else:
                raise ValueError(f"Format non supporté: {format}")
            
            return output_path
            
        except Exception as e:
            raise Exception(f"Erreur lors de la sauvegarde: {str(e)}")
