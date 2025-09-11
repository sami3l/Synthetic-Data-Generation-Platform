"""
Service de gestion des tâches en arrière-plan pour la génération de données synthétiques
"""
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.DataRequest import DataRequest, RequestStatus
from app.models.Notification import Notification, NotificationType
from app.services.SyntheticDataGenerationService import synthetic_data_service
from app.services.SupabaseStorageService import storage_service
from io import BytesIO
import pandas as pd

logger = logging.getLogger(__name__)

class BackgroundTaskService:
    def __init__(self):
        self.active_tasks: Dict[int, asyncio.Task] = {}
    
    async def start_generation_task(
        self,
        request_id: int,
        user_id: int,
        dataset_path: str,
        parameters: Dict[str, Any]
    ):
        """Démarre une tâche de génération de données en arrière-plan"""
        try:
            # Create background task
            task = asyncio.create_task(
                self._generate_synthetic_data_task(
                    request_id, user_id, dataset_path, parameters
                )
            )
            
            # Store task reference
            self.active_tasks[request_id] = task
            
            logger.info(f"Background generation task started for request {request_id}")
            
        except Exception as e:
            logger.error(f"Failed to start background task for request {request_id}: {e}")
            await self._update_request_status(request_id, RequestStatus.FAILED, str(e))
    
    async def _generate_synthetic_data_task(
        self,
        request_id: int,
        user_id: int,
        dataset_path: str,
        parameters: Dict[str, Any]
    ):
        """Tâche de génération de données synthétiques"""
        db = SessionLocal()
        
        try:
            # Update status to processing
            await self._update_request_status(request_id, RequestStatus.PROCESSING)
            
            # Send notification
            await self._create_notification(
                user_id,
                NotificationType.GENERATION_STARTED,
                f"Génération de données synthétiques démarrée pour la requête #{request_id}"
            )
            
            # Download original dataset
            dataset_bytes = await storage_service.download_file(dataset_path)
            if not dataset_bytes:
                raise ValueError("Impossible de télécharger le dataset original")
            
            # Load dataset into DataFrame
            df = self._bytes_to_dataframe(dataset_bytes, dataset_path)
            
            # Generate synthetic data
            synthetic_df, metadata = await synthetic_data_service.generate_synthetic_data(
                df, parameters
            )
            
            # Convert synthetic data to CSV bytes
            synthetic_csv = synthetic_df.to_csv(index=False)
            synthetic_bytes = synthetic_csv.encode('utf-8')
            
            # Upload synthetic data to storage
            synthetic_path = f"synthetic/{user_id}/{request_id}/synthetic_data.csv"
            upload_result = await storage_service.upload_file(
                synthetic_path,
                BytesIO(synthetic_bytes),
                "text/csv"
            )
            
            if not upload_result:
                raise ValueError("Impossible d'uploader les données synthétiques")
            
            # Update request with results
            request = db.query(DataRequest).filter(DataRequest.id == request_id).first()
            if request:
                request.status = RequestStatus.COMPLETED
                request.completed_at = datetime.utcnow()
                request.synthetic_data_path = synthetic_path
                request.generation_metadata = metadata
                db.commit()
            
            # Send success notification
            await self._create_notification(
                user_id,
                NotificationType.GENERATION_COMPLETED,
                f"Génération de données synthétiques terminée pour la requête #{request_id}"
            )
            
            logger.info(f"Synthetic data generation completed for request {request_id}")
            
        except Exception as e:
            logger.error(f"Error in generation task for request {request_id}: {e}")
            
            # Update status to failed
            await self._update_request_status(request_id, RequestStatus.FAILED, str(e))
            
            # Send error notification
            await self._create_notification(
                user_id,
                NotificationType.GENERATION_FAILED,
                f"Erreur lors de la génération pour la requête #{request_id}: {str(e)}"
            )
            
        finally:
            # Clean up task reference
            if request_id in self.active_tasks:
                del self.active_tasks[request_id]
            
            db.close()
    
    def _bytes_to_dataframe(self, data_bytes: bytes, file_path: str) -> pd.DataFrame:
        """Convertit les bytes en DataFrame selon l'extension du fichier"""
        file_extension = file_path.lower().split('.')[-1]
        
        if file_extension == 'csv':
            return pd.read_csv(BytesIO(data_bytes))
        elif file_extension == 'json':
            return pd.read_json(BytesIO(data_bytes))
        elif file_extension in ['xlsx', 'xls']:
            return pd.read_excel(BytesIO(data_bytes))
        elif file_extension == 'parquet':
            return pd.read_parquet(BytesIO(data_bytes))
        else:
            raise ValueError(f"Format de fichier non supporté: {file_extension}")
    
    async def _update_request_status(
        self, 
        request_id: int, 
        status: RequestStatus, 
        error_message: str = None
    ):
        """Met à jour le statut d'une requête"""
        db = SessionLocal()
        try:
            request = db.query(DataRequest).filter(DataRequest.id == request_id).first()
            if request:
                request.status = status
                if error_message:
                    request.error_message = error_message
                if status == RequestStatus.COMPLETED:
                    request.completed_at = datetime.utcnow()
                db.commit()
                
        except Exception as e:
            logger.error(f"Failed to update request status: {e}")
        finally:
            db.close()
    
    async def _create_notification(
        self,
        user_id: int,
        notification_type: NotificationType,
        message: str
    ):
        """Crée une notification pour l'utilisateur"""
        db = SessionLocal()
        try:
            notification = Notification(
                user_id=user_id,
                type=notification_type,
                message=message,
                created_at=datetime.utcnow()
            )
            db.add(notification)
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to create notification: {e}")
        finally:
            db.close()
    
    def get_task_status(self, request_id: int) -> Optional[str]:
        """Obtient le statut d'une tâche en cours"""
        if request_id in self.active_tasks:
            task = self.active_tasks[request_id]
            if task.done():
                return "completed"
            elif task.cancelled():
                return "cancelled"
            else:
                return "running"
        return None
    
    async def cancel_task(self, request_id: int) -> bool:
        """Annule une tâche en cours"""
        if request_id in self.active_tasks:
            task = self.active_tasks[request_id]
            if not task.done():
                task.cancel()
                await self._update_request_status(request_id, RequestStatus.CANCELLED)
                del self.active_tasks[request_id]
                return True
        return False

# Instance globale du service
background_task_service = BackgroundTaskService()
