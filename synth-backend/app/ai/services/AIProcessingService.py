from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
import pandas as pd
import os
import io
import random
import requests
from pathlib import Path
from itertools import product
from typing import Dict, Any, Tuple, List, Optional
import logging
from datetime import datetime
from contextlib import asynccontextmanager

from app.models.DataRequest import DataRequest
from app.models.RequestParameters import RequestParameters
from app.models.UploadedDataset import UploadedDataset
from app.ai.services.quality_validator import QualityValidator
from app.ai.models.model_factory import get_model_wrapper
from app.services.DataRequestService import DataRequestService
from app.services.DatasetService import DatasetService
from app.services.NotificationService import NotificationService
from app.services.SimpleSupabaseStorage import SimpleSupabaseStorage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CTGAN_HYPERPARAMETERS = [
    "epochs", "batch_size", "learning_rate", "discriminator_lr", "generator_lr"
]

TVAE_HYPERPARAMETERS = [
    "epochs", "batch_size", "learning_rate", "embedding_dim", "compressor_dim"
]

class AIProcessingService:
    def __init__(self):
        self.quality_validator = QualityValidator()
        self.dataset_service = DatasetService()
        self.request_service = DataRequestService()
        self.notification_service = NotificationService()
        self.storage = SimpleSupabaseStorage()
        
        # Define base paths (kept for backward compatibility)
        self.base_path = Path(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        self.data_dir = self.base_path / "data"
        self.dataset_dir = self.data_dir / "datasets"
        self.synthetic_dir = self.data_dir / "synthetic"
        
        # Create necessary directories
        self._ensure_directories()

    def _ensure_directories(self):
        """Ensure all required directories exist"""
        self.dataset_dir.mkdir(parents=True, exist_ok=True)
        self.synthetic_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Directories initialized: {self.dataset_dir}, {self.synthetic_dir}")

    def optimize_hyperparameters(search_type, hyperparameters, n_trials):
        if search_type == "grid":
            # Implémentation de la recherche par grille
            pass
        elif search_type == "random":
            # Implémentation de la recherche aléatoire
            pass
        elif search_type == "bayesian":
            # Implémentation de l'optimisation bayésienne
            pass

    async def generate_synthetic_data(
        self,   
        db: Session,
        request_id: int,
        current_user_id: Optional[int] = None,
        optimize: bool = False,
        search_type: str = "grid",
        n_random: int = 5
    ) -> Dict[str, Any]:
        """
        Generate synthetic data based on the provided parameters.
        This method is deprecated - use process_generation_request instead.
        """
        # Redirect to the new method
        return await self.process_generation_request(
            db=db,
            request_id=request_id,
            current_user_id=current_user_id
        )

    async def search_best_hyperparameters(
        self,
        data: pd.DataFrame,
        params: RequestParameters,
        search_type: str = "grid",
        n_random: int = 5
    ) -> Tuple[Any, Dict[str, Any], float]:
        """
        Search for optimal hyperparameters for the model
        
        Args:
            data: DataFrame containing training data
            params: Request parameters
            search_type: Search type ("grid" or "random")
            n_random: Number of trials for random search
            
        Returns:
            Tuple containing (best_model, best_parameters, best_score)
        """
        # Parameter grid to test
        param_grid = {
            'epochs': [300, 500, 1000],
            'batch_size': [500, 1000, 2000],
            'learning_rate': [0.001, 0.0001, 0.00001]
        }

        best_score = -float('inf')
        best_params = None
        best_model = None
        tested_combinations = []

        # Generate parameter combinations
        param_combinations = self._generate_param_combinations(
            param_grid, search_type, n_random
        )

        logger.info(f"Testing {len(param_combinations)} parameter combinations...")

        # Test each combination
        for i, (epochs, batch_size, learning_rate) in enumerate(param_combinations):
            current_params = {
                "epochs": epochs,
                "batch_size": batch_size,
                "learning_rate": learning_rate
            }
            
            logger.info(f"Testing combination {i+1}/{len(param_combinations)}: {current_params}")
            
            try:
                # Create and train model
                model = get_model_wrapper(
                    model_type=params.model_type,
                    hyperparameters=current_params
                )

                await model.train(data)
                synthetic_data = await model.generate(len(data))
                
                # Evaluate quality
                quality_score = self.quality_validator.evaluate(
                    real_data=data,
                    synthetic_data=synthetic_data
                )

                tested_combinations.append({
                    'params': current_params.copy(),
                    'score': quality_score
                })

                logger.info(f"Quality score: {quality_score:.4f}")

                # Check if this is the best score
                if quality_score > best_score:
                    best_score = quality_score
                    best_params = current_params.copy()
                    best_model = model
                    logger.info(f"New best score: {quality_score:.4f}")

            except Exception as e:
                logger.error(f"Error testing parameters {current_params}: {str(e)}")
                continue

        if best_model is None:
            raise HTTPException(
                status_code=500,
                detail="No parameter combination worked successfully"
            )

        logger.info(f"Best parameters found: {best_params} with score: {best_score:.4f}")
        return best_model, best_params, best_score

    def _generate_param_combinations(
        self, 
        param_grid: Dict[str, List], 
        search_type: str, 
        n_random: int
    ) -> List[Tuple]:
        """
        Generate parameter combinations based on search type
        
        Args:
            param_grid: Parameter grid
            search_type: Search type
            n_random: Number of random trials
            
        Returns:
            List of parameter combinations
        """
        if search_type == "random":
            # Random selection of combinations
            all_combinations = list(product(*param_grid.values()))
            if len(all_combinations) <= n_random:
                return all_combinations
            return random.sample(all_combinations, n_random)
        else:
            # Grid search - all combinations
            return list(product(*param_grid.values()))

    async def load_dataset_robustly(
        self,
        db: Session,
        uploaded_dataset: Optional[UploadedDataset],
        data_request: Optional[DataRequest] = None
    ) -> Tuple[pd.DataFrame, UploadedDataset]:
        """
        Charge un dataset de manière robuste avec plusieurs méthodes de récupération
        
        Args:
            db: Session de base de données
            uploaded_dataset: Dataset à charger (peut être None)
            data_request: Requête associée (peut être None)
            
        Returns:
            Tuple avec (DataFrame chargé, UploadedDataset utilisé)
            
        Raises:
            HTTPException: Si le dataset ne peut pas être chargé
        """
        # Vérifier si on a un dataset et un chemin valide
        if not uploaded_dataset or not uploaded_dataset.file_path:
            if not data_request:
                raise HTTPException(
                    status_code=400, 
                    detail="Aucun dataset ni requête fournis pour le chargement"
                )
            
            logger.warning(f"Dataset manquant pour la requête {data_request.id}. Recherche d'un dataset alternatif...")
            
            # Chercher un dataset pour cet utilisateur
            alternative_datasets = db.query(UploadedDataset).filter(
                UploadedDataset.user_id == data_request.user_id
            ).all()
            
            if not alternative_datasets:
                raise HTTPException(
                    status_code=404,
                    detail="Aucun dataset trouvé pour cet utilisateur. Veuillez télécharger un dataset."
                )
            
            # Essayer de trouver une correspondance par nom
            if data_request.dataset_name:
                for alt_dataset in alternative_datasets:
                    if (alt_dataset.original_filename and 
                        (alt_dataset.original_filename.lower() in data_request.dataset_name.lower() or 
                         data_request.dataset_name.lower() in alt_dataset.original_filename.lower())):
                        
                        if await self.storage.check_file_exists(alt_dataset.file_path):
                            logger.info(f"Dataset correspondant trouvé: {alt_dataset.id} - {alt_dataset.original_filename}")
                            uploaded_dataset = alt_dataset
                            
                            # Mettre à jour la requête
                            if data_request:
                                data_request.uploaded_dataset_id = alt_dataset.id
                                db.commit()
                            
                            break
            
            # Si aucune correspondance, prendre le plus récent
            if not uploaded_dataset:
                logger.warning("Aucune correspondance par nom. Utilisation du dataset le plus récent.")
                
                for alt_dataset in sorted(alternative_datasets, key=lambda d: d.created_at or datetime.min, reverse=True):
                    if await self.storage.check_file_exists(alt_dataset.file_path):
                        logger.info(f"Utilisation du dataset le plus récent: {alt_dataset.id} - {alt_dataset.original_filename}")
                        uploaded_dataset = alt_dataset
                        
                        # Mettre à jour la requête
                        if data_request:
                            data_request.uploaded_dataset_id = alt_dataset.id
                            db.commit()
                        
                        break
        
        # À ce stade, on devrait avoir un dataset
        if not uploaded_dataset or not uploaded_dataset.file_path:
            raise HTTPException(
                status_code=404,
                detail="Aucun dataset valide n'a pu être trouvé. Veuillez télécharger un dataset."
            )
        
        # Vérifier que le fichier existe réellement
        file_path = uploaded_dataset.file_path
        file_exists = await self.storage.check_file_exists(file_path)
        
        if not file_exists:
            logger.error(f"Le fichier n'existe pas dans le stockage: {file_path}")
            
            # On pourrait implémenter une recherche par nom de fichier similaire ici
            # Mais pour l'instant, on échoue
            raise HTTPException(
                status_code=404,
                detail=f"Le fichier dataset '{uploaded_dataset.original_filename}' n'existe pas dans le stockage. "
                      f"Veuillez télécharger à nouveau le dataset."
            )
        
        # Essayer de télécharger le fichier
        logger.info(f"Téléchargement du dataset depuis Supabase: {file_path}")
        raw_bytes = await self.storage.download_file(file_path)
        
        if not raw_bytes:
            logger.error(f"Échec du téléchargement du dataset: {file_path}")
            
            # Essayer une URL directe
            try:
                # URL publique directe
                public_url = f"{self.storage.supabase_url}/storage/v1/object/public/{self.storage.bucket_name}/{file_path}"
                logger.info(f"Tentative de téléchargement direct par URL: {public_url}")
                
                direct_response = requests.get(public_url, timeout=30)
                if direct_response.status_code == 200 and direct_response.content:
                    logger.info("Téléchargement réussi via URL publique")
                    raw_bytes = direct_response.content
                else:
                    # Essayer via une URL signée
                    logger.info("Tentative via URL signée...")
                    signed_url = await self.storage.get_download_url(file_path)
                    
                    if signed_url:
                        logger.info(f"URL signée générée: {signed_url[:50]}...")
                        signed_response = requests.get(signed_url, timeout=30)
                        
                        if signed_response.status_code == 200 and signed_response.content:
                            logger.info("Téléchargement réussi via URL signée")
                            raw_bytes = signed_response.content
                        else:
                            logger.error(f"Échec via URL signée: status={signed_response.status_code}")
                    else:
                        logger.error("Impossible de générer une URL signée")
            except Exception as url_error:
                logger.error(f"Échec de toutes les tentatives de téléchargement: {str(url_error)}")
        
        # Si on a les données, les charger
        if raw_bytes:
            try:
                # Essayer différents encodages
                try:
                    data_df = pd.read_csv(io.BytesIO(raw_bytes))
                except Exception as first_error:
                    logger.warning(f"Premier essai de lecture CSV échoué: {str(first_error)}")
                    try:
                        data_df = pd.read_csv(io.BytesIO(raw_bytes), encoding='latin1')
                    except Exception as second_error:
                        logger.warning(f"Deuxième essai échoué: {str(second_error)}")
                        # Dernier essai avec plus d'options
                        data_df = pd.read_csv(
                            io.BytesIO(raw_bytes),
                            encoding='latin1',
                            on_bad_lines='skip',
                            low_memory=False
                        )
                
                logger.info(f"Dataset chargé avec succès: {len(data_df)} lignes, {len(data_df.columns)} colonnes")
                return data_df, uploaded_dataset
            
            except Exception as load_error:
                logger.error(f"Échec de lecture du CSV: {str(load_error)}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Le fichier CSV ne peut pas être lu: {str(load_error)}"
                )
        else:
            raise HTTPException(
                status_code=404,
                detail="Impossible de télécharger le dataset après plusieurs tentatives."
            )

    @asynccontextmanager
    async def _handle_request_status(self, db: Session, data_request: DataRequest):
        """Context manager to handle request status updates"""
        try:
            data_request.status = "processing"
            db.commit()
            yield
            data_request.status = "completed"
            db.commit()
        except Exception as e:
            data_request.status = "failed"
            data_request.error_message = str(e)
            db.commit()
            raise

    async def process_generation_request(
        self, 
        db: Session,
        request_id: int,
        current_user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Process a data generation request with optional optimization"""
        
        try:
            # Retrieve request and parameters
            data_request = db.query(DataRequest).options(
                joinedload(DataRequest.request_parameters),
                joinedload(DataRequest.uploaded_dataset)
            ).filter(DataRequest.id == request_id).first()
            
            if not data_request:
                raise HTTPException(status_code=404, detail="Request not found")

            # Get dataset storage path from uploaded_dataset relationship
            uploaded_dataset = data_request.uploaded_dataset
            logger.info(f"Data request ID: {data_request.id}")
            logger.info(f"Uploaded dataset ID: {data_request.uploaded_dataset_id}")
            logger.info(f"Uploaded dataset object: {uploaded_dataset}")
            logger.info(f"File path: {uploaded_dataset.file_path if uploaded_dataset else 'None'}")
            
            # Si uploaded_dataset est None, essayons de trouver un dataset correspondant
            if not uploaded_dataset:
                logger.warning(f"No uploaded_dataset_id associated with request {request_id}. Trying to find a match...")
                
                # Chercher un dataset ayant un nom similaire à dataset_name
                possible_datasets = db.query(UploadedDataset).filter(
                    UploadedDataset.user_id == data_request.user_id
                ).all()
                
                logger.info(f"Found {len(possible_datasets)} datasets for user {data_request.user_id}")
                
                # Essayer de trouver une correspondance par nom
                for dataset in possible_datasets:
                    if (dataset.original_filename and data_request.dataset_name and 
                        (dataset.original_filename.lower() in data_request.dataset_name.lower() or 
                        data_request.dataset_name.lower() in dataset.original_filename.lower())):
                        
                        # Vérifier si le fichier existe dans le stockage
                        if dataset.file_path and await self.storage.check_file_exists(dataset.file_path):
                            logger.info(f"Found matching dataset with valid file: {dataset.id} - {dataset.original_filename}")
                            uploaded_dataset = dataset
                            
                            # Mettre à jour la requête avec ce dataset
                            data_request.uploaded_dataset_id = dataset.id
                            db.commit()
                            break
                        else:
                            logger.warning(f"Found matching dataset but file does not exist: {dataset.id} - {dataset.file_path}")
                
                # Si aucun dataset correspondant n'est trouvé, prendre le plus récent dont le fichier existe
                if not uploaded_dataset and possible_datasets:
                    logger.warning("No exact match found. Trying to use the most recent dataset with a valid file.")
                    
                    for dataset in sorted(possible_datasets, key=lambda d: d.created_at or datetime.min, reverse=True):
                        if dataset.file_path and await self.storage.check_file_exists(dataset.file_path):
                            logger.info(f"Using most recent dataset: {dataset.id} - {dataset.original_filename}")
                            uploaded_dataset = dataset
                            data_request.uploaded_dataset_id = dataset.id
                            db.commit()
                            break
            
            # Vérifier si le dataset sélectionné a un fichier valide
            if uploaded_dataset and uploaded_dataset.file_path:
                # Vérifier si le fichier existe réellement dans Supabase
                file_exists = await self.storage.check_file_exists(uploaded_dataset.file_path)
                if not file_exists:
                    logger.error(f"Dataset file does not exist in storage: {uploaded_dataset.file_path}")
                    
                    # Chercher un autre dataset valide pour cet utilisateur
                    alternative_datasets = db.query(UploadedDataset).filter(
                        UploadedDataset.user_id == data_request.user_id,
                        UploadedDataset.id != uploaded_dataset.id
                    ).all()
                    
                    for alt_dataset in sorted(alternative_datasets, key=lambda d: d.created_at or datetime.min, reverse=True):
                        if await self.storage.check_file_exists(alt_dataset.file_path):
                            logger.info(f"Found alternative dataset: {alt_dataset.id} - {alt_dataset.original_filename}")
                            uploaded_dataset = alt_dataset
                            data_request.uploaded_dataset_id = alt_dataset.id
                            db.commit()
                            break
                    else:
                        # Aucun dataset alternatif trouvé
                        raise HTTPException(
                            status_code=404,
                            detail=f"Le fichier dataset '{uploaded_dataset.original_filename}' n'existe pas dans le stockage. "
                                  f"Veuillez télécharger à nouveau le dataset ou en sélectionner un autre."
                        )
            
            if not uploaded_dataset or not uploaded_dataset.file_path:
                error_msg = f"Dataset validation failed - uploaded_dataset: {uploaded_dataset}, file_path: {uploaded_dataset.file_path if uploaded_dataset else 'None'}"
                logger.error(error_msg)
                
                # Message d'erreur plus explicite avec instructions
                raise HTTPException(
                    status_code=404, 
                    detail="Dataset introuvable. Veuillez vous assurer qu'un dataset valide est associé à cette requête et qu'il a bien été téléchargé."
                )

            # Load parameters
            params = data_request.request_parameters
            if not params:
                raise HTTPException(
                    status_code=400,
                    detail="Parameters not found for request"
                )

            async with self._handle_request_status(db, data_request):
                # Utiliser notre méthode robuste pour charger le dataset
                logger.info(f"Chargement du dataset avec la méthode robuste pour la requête {data_request.id}")
                
                try:
                    # Appel de notre méthode robuste qui gère toutes les vérifications et fallbacks
                    original_data, used_dataset = await self.load_dataset_robustly(db, uploaded_dataset, data_request)
                    
                    # Si un dataset différent a été utilisé, mettre à jour la référence
                    if used_dataset.id != uploaded_dataset.id:
                        logger.info(f"Dataset alternatif utilisé: {used_dataset.id} au lieu de {uploaded_dataset.id}")
                        uploaded_dataset = used_dataset
                    
                    logger.info(f"Dataset chargé avec succès: {len(original_data)} lignes et {len(original_data.columns)} colonnes")
                    
                    # Vérifier que le DataFrame n'est pas vide
                    if original_data.empty:
                        logger.error(f"Dataset est vide: {uploaded_dataset.file_path}")
                        raise HTTPException(
                            status_code=400,
                            detail=f"Le fichier dataset '{uploaded_dataset.original_filename}' est vide. Veuillez utiliser un dataset non-vide."
                        )
                except Exception as e:
                    logger.error(f"Failed to load dataset from Supabase: {str(e)}", exc_info=True)
                    raise HTTPException(
                        status_code=500,
                        detail=f"Erreur lors du chargement du dataset: {str(e)}"
                    )

                # Initialize variables
                model = None
                synthetic_data = None
                quality_score = None
                optimized = False
                best_params = {
                    "epochs": params.epochs,
                    "batch_size": params.batch_size,
                    "learning_rate": params.learning_rate
                }

                # Check if optimization is enabled
                if params.optimization_enabled:
                    logger.info("Starting hyperparameter optimization...")
                    optimized = True
                    
                    try:
                        # Optimization mode
                        model, optimization_results, quality_score = await self.search_best_hyperparameters(
                            data=original_data,
                            params=params,
                            search_type=params.optimization_method or "grid",
                            n_random=params.optimization_n_trials or 5
                        )
                        
                        # Update best_params with optimization results
                        if optimization_results:
                            best_params.update(optimization_results)
                            
                            # Update parameters with best found
                            params.epochs = best_params["epochs"]
                            params.batch_size = best_params["batch_size"]
                            params.learning_rate = best_params["learning_rate"]
                            db.commit()
                        
                        # Generate data with best model
                        synthetic_data = await model.generate(len(original_data))
                        
                    except Exception as opt_error:
                        logger.warning(f"Optimization failed, using default parameters: {str(opt_error)}")
                        optimized = False
                        # Fall back to default parameters
                        model = get_model_wrapper(
                            model_type=params.model_type,
                            hyperparameters=best_params
                        )
                        
                if not optimized:
                    logger.info("Using standard hyperparameters...")
                    # Normal mode without optimization
                    model = get_model_wrapper(
                        model_type=params.model_type,
                        hyperparameters=best_params
                    )

                # Train model (if not already trained during optimization)
                if not optimized:
                    await model.train(original_data)

                # Generate synthetic data (if not already generated during optimization)
                if synthetic_data is None:
                    synthetic_data = await model.generate(len(original_data))

                # Evaluate quality (if not already evaluated during optimization)
                if quality_score is None:
                    quality_score = self.quality_validator.evaluate(
                        real_data=original_data,
                        synthetic_data=synthetic_data
                    )

                # Upload synthetic data directly to Supabase Storage
                output_rel_path = f"{current_user_id}/synthetic/{request_id}_synthetic_data.csv"
                logger.info(f"Uploading synthetic data to Supabase: {output_rel_path}")
                
                try:
                    # Convert DataFrame to CSV bytes
                    buf = io.BytesIO()
                    synthetic_data.to_csv(buf, index=False)
                    buf.seek(0)  # Reset position for upload
                    
                    # Upload to Supabase
                    supabase_path = await self.storage.upload_file(
                        output_rel_path, 
                        buf, 
                        content_type="text/csv"
                    )
                    
                    logger.info(f"✅ Upload successful to: {supabase_path}")
                    
                    # Generate download URL
                    download_url = await self.storage.get_download_url(
                        supabase_path, 
                        expires_in=7 * 24 * 3600  # 7 days
                    )
                    
                    logger.info(f"✅ Download URL generated successfully")
                    
                except Exception as upload_error:
                    logger.error(f"❌ Supabase upload error: {str(upload_error)}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to upload synthetic data: {str(upload_error)}"
                    )

                # Save synthetic dataset metadata
                synthetic_dataset = self.dataset_service.save_generated_data(
                    db=db,
                    request_id=request_id,
                    file_path=supabase_path,  # Store Supabase storage path
                    user_id=current_user_id,
                    supabase_path=supabase_path,
                    download_url=download_url
                )

                # Create success notification
                notification_created = False
                if quality_score:
                    try:
                        self.notification_service.create_generation_success_notification(
                            db=db,
                            user_id=current_user_id,
                            request_id=request_id,
                            quality_score=quality_score
                        )
                        notification_created = True
                    except Exception as e:
                        logger.error(f"Failed to create notification: {str(e)}")

                result = {
                    "request_id": request_id,
                    "quality_score": round(quality_score, 4) if quality_score else None,
                    "supabase_path": supabase_path,
                    "download_url": download_url,
                    "optimized": optimized,
                    "final_parameters": {
                        "epochs": best_params["epochs"],
                        "batch_size": best_params["batch_size"],
                        "learning_rate": best_params["learning_rate"],
                        "model_type": params.model_type
                    },
                    "notification_created": notification_created
                }

                logger.info(f"Request {request_id} completed successfully")
                return result

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error processing request {request_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_processing_status(self, db: Session, request_id: int) -> Dict[str, Any]:
        """
        Get processing status of a request
        
        Args:
            db: Database session
            request_id: Request ID
            
        Returns:
            Dictionary containing status and request information
        """
        data_request = db.query(DataRequest).filter(DataRequest.id == request_id).first()
        if not data_request:
            raise HTTPException(status_code=404, detail="Request not found")
            
        # Safely access nested attributes
        params = data_request.request_parameters
        optimization_enabled = params.optimization_enabled if params else False
        
        return {
            "request_id": request_id,
            "status": data_request.status,
            "created_at": data_request.created_at,
            "updated_at": data_request.updated_at,
            "dataset_name": data_request.dataset_name,
            "error_message": getattr(data_request, 'error_message', None),
            "parameters": {
                "model_type": params.model_type if params else None,
                "epochs": params.epochs if params else None,
                "batch_size": params.batch_size if params else None,
                "learning_rate": params.learning_rate if params else None,
                "optimization_enabled": optimization_enabled,
                "optimization_search_type": params.optimization_method if params else None,
                "optimization_n_trials": params.optimization_n_trials if params else None
            }
        }