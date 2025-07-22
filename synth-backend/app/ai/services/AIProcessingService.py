from fastapi import HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import os
import random
from pathlib import Path
from itertools import product
from typing import Dict, Any, Tuple, List, Optional
from app.models.DataRequest import DataRequest
from app.models.RequestParameters import RequestParameters
from app.ai.services.quality_validator import QualityValidator
from app.ai.models.model_factory import get_model_wrapper
from app.services.DataRequestService import DataRequestService
from app.services.DatasetService import DatasetService
from app.services.NotificationService import NotificationService

class AIProcessingService:
    def __init__(self):
        self.quality_validator = QualityValidator()
        self.dataset_service = DatasetService()
        self.request_service = DataRequestService()
        self.notification_service = NotificationService()
        
        # Définir les chemins de base
        self.base_path = Path(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        self.data_dir = self.base_path / "data"
        self.dataset_dir = self.data_dir / "datasets"
        self.synthetic_dir = self.data_dir / "synthetic"
        
        # Créer les dossiers nécessaires
        self.dataset_dir.mkdir(parents=True, exist_ok=True)
        self.synthetic_dir.mkdir(parents=True, exist_ok=True)

    async def search_best_hyperparameters(
        self,
        data: pd.DataFrame,
        params: RequestParameters,
        search_type: str = "grid",
        n_random: int = 5
    ) -> Tuple[Any, Dict[str, Any], float]:
        """
        Recherche les meilleurs hyperparamètres pour le modèle
        
        Args:
            data: DataFrame contenant les données d'entraînement
            params: Paramètres de la requête
            search_type: Type de recherche ("grid" ou "random")
            n_random: Nombre d'essais pour la recherche aléatoire
            
        Returns:
            Tuple contenant (meilleur_modèle, meilleurs_paramètres, meilleur_score)
        """
        # Grille de paramètres à tester
        param_grid = {
            'epochs': [300, 500, 1000],
            'batch_size': [500, 1000, 2000],
            'learning_rate': [0.001, 0.0001, 0.00001]
        }

        best_score = -float('inf')
        best_params = None
        best_model = None
        tested_combinations = []

        # Générer les combinaisons de paramètres
        param_combinations = self._generate_param_combinations(
            param_grid, search_type, n_random
        )

        print(f"Testing {len(param_combinations)} parameter combinations...")

        # Tester chaque combinaison
        for i, (epochs, batch_size, learning_rate) in enumerate(param_combinations):
            current_params = {
                "epochs": epochs,
                "batch_size": batch_size,
                "learning_rate": learning_rate
            }
            
            print(f"Testing combination {i+1}/{len(param_combinations)}: {current_params}")
            
            try:
                # Créer et entraîner le modèle
                model = get_model_wrapper(
                    model_type=params.model_type,
                    hyperparameters=current_params
                )

                await model.train(data)
                synthetic_data = await model.generate(len(data))
                
                # Évaluer la qualité
                quality_score = self.quality_validator.evaluate(
                    real_data=data,
                    synthetic_data=synthetic_data
                )

                tested_combinations.append({
                    'params': current_params.copy(),
                    'score': quality_score
                })

                print(f"Quality score: {quality_score:.4f}")

                # Vérifier si c'est le meilleur score
                if quality_score > best_score:
                    best_score = quality_score
                    best_params = current_params.copy()
                    best_model = model
                    print(f"New best score: {quality_score:.4f}")

            except Exception as e:
                print(f"Error testing parameters {current_params}: {str(e)}")
                continue

        if best_model is None:
            raise HTTPException(
                status_code=500,
                detail="Aucune combinaison de paramètres n'a fonctionné"
            )

        print(f"Best parameters found: {best_params} with score: {best_score:.4f}")
        return best_model, best_params, best_score

    def _generate_param_combinations(
        self, 
        param_grid: Dict[str, List], 
        search_type: str, 
        n_random: int
    ) -> List[Tuple]:
        """
        Génère les combinaisons de paramètres selon le type de recherche
        
        Args:
            param_grid: Grille des paramètres
            search_type: Type de recherche
            n_random: Nombre d'essais aléatoires
            
        Returns:
            Liste des combinaisons de paramètres
        """
        if search_type == "random":
            # Sélection aléatoire de combinaisons
            all_combinations = list(product(*param_grid.values()))
            if len(all_combinations) <= n_random:
                return all_combinations
            return random.sample(all_combinations, n_random)
        else:
            # Grid search - toutes les combinaisons
            return list(product(*param_grid.values()))

    async def process_generation_request(
        self, 
        db: Session,
        request_id: int,
        current_user_id: Optional[int] = None
    ):
        """Traite une requête de génération de données avec optimisation optionnelle"""
        data_request = None
        
        try:
            # Récupérer la requête et ses paramètres
            data_request = db.query(DataRequest).filter(DataRequest.id == request_id).first()
            if not data_request:
                raise HTTPException(status_code=404, detail="Requête non trouvée")

            # Vérifier si le fichier existe
            dataset_path = self.dataset_dir / data_request.dataset_name
            if not dataset_path.exists():
                raise HTTPException(
                    status_code=404, 
                    detail=f"Dataset non trouvé: {dataset_path}"
                )

            # Charger les paramètres
            params = data_request.parameters
            if not params:
                raise HTTPException(
                    status_code=400,
                    detail="Paramètres non trouvés pour la requête"
                )

            # Mettre à jour le statut de la requête
            data_request.status = "processing"
            db.commit()

            # Charger les données d'origine
            original_data = pd.read_csv(dataset_path)
            print(f"Loaded dataset with {len(original_data)} rows and {len(original_data.columns)} columns")

            # Variables pour stocker les résultats
            model = None
            synthetic_data = None
            quality_score = None
            optimized = False

            # Vérifier si l'optimisation est activée
            if params.optimization_enabled:
                print("Starting hyperparameter optimization...")
                optimized = True
                
                # Mode optimisation
                model, best_params, quality_score = await self.search_best_hyperparameters(
                    data=original_data,
                    params=params,
                    search_type=params.optimization_search_type or "grid",
                    n_random=params.optimization_n_trials or 5
                )
                
                # Mettre à jour les paramètres avec les meilleurs trouvés
                params.epochs = best_params["epochs"]
                params.batch_size = best_params["batch_size"]
                params.learning_rate = best_params["learning_rate"]
                db.commit()
                
                # Générer les données avec le meilleur modèle
                synthetic_data = await model.generate(len(original_data))
                
            else:
                print("Using standard hyperparameters...")
                # Mode normal sans optimisation
                model = get_model_wrapper(
                    model_type=params.model_type,
                    hyperparameters={
                        "epochs": params.epochs,
                        "batch_size": params.batch_size,
                        "learning_rate": params.learning_rate
                    }
                )

                # Entraîner le modèle
                await model.train(original_data)

                # Générer les données synthétiques
                synthetic_data = await model.generate(len(original_data))

                # Évaluer la qualité
                quality_score = self.quality_validator.evaluate(
                    real_data=original_data,
                    synthetic_data=synthetic_data
                )

            # Créer le chemin de sortie
            output_filename = f"{request_id}_synthetic_data.csv"
            output_path = self.synthetic_dir / output_filename

            # Sauvegarder les résultats
            synthetic_data.to_csv(output_path, index=False)
            print(f"Synthetic data saved to: {output_path}")
            
            # Mettre à jour le statut de la requête
            data_request.status = "completed"
            db.commit()

            # Sauvegarder le dataset synthétique
            self.dataset_service.save_generated_data(
                db=db,
                request_id=request_id,
                file_path=str(output_path),
                user_id=current_user_id,
            )

            # Après la génération réussie et la sauvegarde
            if quality_score:
                self.notification_service.create_generation_success_notification(
                    db=db,
                    user_id=current_user_id,
                    request_id=request_id,
                    quality_score=quality_score
                )

            result = {
                "request_id": request_id,
                "quality_score": round(quality_score, 4) if quality_score else None,
                "output_path": str(output_path),
                "optimized": optimized,
                "final_parameters": {
                    "epochs": params.epochs,
                    "batch_size": params.batch_size,
                    "learning_rate": params.learning_rate,
                    "model_type": params.model_type
                },
                "notification_created": True
            }

            print(f"Request {request_id} completed successfully")
            return result

        except Exception as e:
            print(f"Error processing request {request_id}: {str(e)}")
            if data_request:
                data_request.status = "failed"
                db.commit()
            raise HTTPException(status_code=500, detail=str(e))

    async def get_processing_status(self, db: Session, request_id: int) -> Dict[str, Any]:
        """
        Récupère le statut de traitement d'une requête
        
        Args:
            db: Session de base de données
            request_id: ID de la requête
            
        Returns:
            Dictionnaire contenant le statut et les informations de la requête
        """
        data_request = db.query(DataRequest).filter(DataRequest.id == request_id).first()
        if not data_request:
            raise HTTPException(status_code=404, detail="Requête non trouvée")
            
        return {
            "request_id": request_id,
            "status": data_request.status,
            "created_at": data_request.created_at,
            "updated_at": data_request.updated_at,
            "dataset_name": data_request.dataset_name,
            "parameters": {
                "model_type": data_request.parameters.model_type if data_request.parameters else None,
                "epochs": data_request.parameters.epochs if data_request.parameters else None,
                "batch_size": data_request.parameters.batch_size if data_request.parameters else None,
                "learning_rate": data_request.parameters.learning_rate if data_request.parameters else None,
                "optimization_enabled": data_request.parameters.optimization.enabled if data_request.parameters and data_request.parameters.optimization else False,
                "optimization_search_type": data_request.parameters.optimization_search_type if data_request.parameters else None,
                "optimization_n_trials": data_request.parameters.optimization_n_trials if data_request.parameters else None
            }
        }