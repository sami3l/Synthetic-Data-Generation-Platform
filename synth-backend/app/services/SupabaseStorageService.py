"""
Service de gestion du stockage Supabase pour les datasets et données synthétiques
"""
import os
import logging
from typing import Optional, BinaryIO
from supabase import create_client, Client
from storage3.utils import StorageException
from app.core.config import settings

logger = logging.getLogger(__name__)

class SupabaseStorageService:
    def __init__(self):
        try:
            # Pour la compatibilité avec supabase-py 2.17.0+
            self.supabase: Client = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_ANON_KEY
            )
            self.bucket_name = settings.SUPABASE_BUCKET_NAME
            logger.info(f"SupabaseStorageService initialized with bucket: {self.bucket_name}")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise
        
    async def upload_file(
        self, 
        file_path: str, 
        file_data: BinaryIO, 
        content_type: str = "application/octet-stream"
    ) -> Optional[str]:
        """Upload un fichier vers Supabase Storage"""
        try:
            logger.info(f"Starting upload to path: {file_path}")
            logger.info(f"Content type: {content_type}")
            logger.info(f"Bucket: {self.bucket_name}")
            
            # Reset file pointer to beginning
            file_data.seek(0)
            
            # Ensure bucket exists
            await self._ensure_bucket_exists()
            
            # Upload file
            response = self.supabase.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_data,
                file_options={"content-type": content_type, "upsert": True}
            )
            
            logger.info(f"Upload response: {response}")
            
            # Check if response is successful
            if hasattr(response, 'status_code'):
                if response.status_code == 200:
                    logger.info(f"File uploaded successfully: {file_path}")
                    return file_path
                else:
                    logger.error(f"Upload failed with status {response.status_code}: {response}")
                    return None
            elif response:  # If response exists and no status_code
                logger.info(f"File uploaded successfully: {file_path}")
                return file_path
            else:
                logger.error(f"Upload failed: {response}")
                return None
                
        except StorageException as e:
            logger.error(f"Storage error uploading {file_path}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error uploading {file_path}: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None
    
    async def download_file(self, file_path: str) -> Optional[bytes]:
        """Télécharge un fichier depuis Supabase Storage"""
        try:
            response = self.supabase.storage.from_(self.bucket_name).download(file_path)
            
            if response:
                logger.info(f"File downloaded successfully: {file_path}")
                return response
            else:
                logger.error(f"Download failed for: {file_path}")
                return None
                
        except StorageException as e:
            logger.error(f"Storage error downloading {file_path}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error downloading {file_path}: {e}")
            return None
    
    async def get_download_url(self, file_path: str, expires_in: int = 3600) -> Optional[str]:
        """Génère une URL de téléchargement temporaire"""
        try:
            response = self.supabase.storage.from_(self.bucket_name).create_signed_url(
                path=file_path,
                expires_in=expires_in
            )
            
            if response and response.get('signedURL'):
                logger.info(f"Download URL generated for: {file_path}")
                return response['signedURL']
            else:
                logger.error(f"Failed to generate download URL for: {file_path}")
                return None
                
        except StorageException as e:
            logger.error(f"Storage error generating URL for {file_path}: {e}")
            return f"{settings.SUPABASE_URL}/storage/v1/object/public/{self.bucket_name}/{file_path}"
        except Exception as e:
            logger.error(f"Unexpected error generating URL for {file_path}: {e}")
            return None
    
    async def delete_file(self, file_path: str) -> bool:
        """Supprime un fichier du stockage"""
        try:
            response = self.supabase.storage.from_(self.bucket_name).remove([file_path])
            
            if response:
                logger.info(f"File deleted successfully: {file_path}")
                return True
            else:
                logger.error(f"Delete failed for: {file_path}")
                return False
                
        except StorageException as e:
            logger.error(f"Storage error deleting {file_path}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting {file_path}: {e}")
            return False
    
    async def list_files(self, prefix: str = "") -> list:
        """Liste les fichiers dans le bucket"""
        try:
            response = self.supabase.storage.from_(self.bucket_name).list(path=prefix)
            
            if response:
                logger.info(f"Files listed successfully with prefix: {prefix}")
                return response
            else:
                logger.error(f"Failed to list files with prefix: {prefix}")
                return []
                
        except StorageException as e:
            logger.error(f"Storage error listing files with prefix {prefix}: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error listing files: {e}")
            return []
    
    async def _ensure_bucket_exists(self):
        """S'assure que le bucket existe"""
        try:
            logger.info(f"Checking if bucket '{self.bucket_name}' exists...")
            
            # Try to get bucket info
            buckets = self.supabase.storage.list_buckets()
            bucket_names = [bucket.name for bucket in buckets]
            
            logger.info(f"Available buckets: {bucket_names}")
            
            if self.bucket_name not in bucket_names:
                # Create bucket if it doesn't exist
                logger.info(f"Creating bucket '{self.bucket_name}'...")
                result = self.supabase.storage.create_bucket(
                    self.bucket_name,
                    options={"public": False}
                )
                logger.info(f"Bucket creation result: {result}")
                logger.info(f"Bucket created: {self.bucket_name}")
            else:
                logger.info(f"Bucket '{self.bucket_name}' already exists")
            
        except Exception as e:
            logger.error(f"Error ensuring bucket exists: {e}")
            # Don't raise the exception, just log it
            # The upload might still work if the bucket exists


storage_service = SupabaseStorageService()
