"""
Service de stockage Supabase simplifié pour éviter les problèmes de compatibilité
"""
import os
import logging
import requests
from typing import Optional, BinaryIO
from app.core.config import settings

logger = logging.getLogger(__name__)

class SimpleSupabaseStorage:
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        # Utiliser la clé de service pour avoir les permissions d'écriture
        self.service_key = settings.SUPABASE_KEY  
        self.bucket_name = settings.SUPABASE_BUCKET_NAME
        
        # Validation des variables d'environnement
        if not self.supabase_url:
            raise ValueError("SUPABASE_URL manquant dans les variables d'environnement")
        if not self.service_key:
            raise ValueError("SUPABASE_KEY manquant dans les variables d'environnement")
        if not self.bucket_name:
            raise ValueError("SUPABASE_BUCKET_NAME manquant dans les variables d'environnement")
        
        # URL de base pour l'API Storage
        self.storage_url = f"{self.supabase_url}/storage/v1"
        
        # Headers par défaut avec la clé de service
        self.headers = {
            'Authorization': f'Bearer {self.service_key}',
            'apikey': self.service_key
        }
        
        logger.info(f"SimpleSupabaseStorage initialized with bucket: {self.bucket_name}")
        logger.info(f"Using Supabase URL: {self.supabase_url}")
        logger.info(f"Service key configured: {'Yes' if self.service_key else 'No'}")
    
    async def upload_file(
        self, 
        file_path: str, 
        file_data: BinaryIO, 
        content_type: str = "application/octet-stream"
    ) -> Optional[str]:
        """Upload un fichier vers Supabase Storage via REST API"""
        try:
            logger.info(f"Starting upload to path: {file_path}")
            
            # S'assurer que le bucket existe
            await self._ensure_bucket_exists()
            
            # URL pour l'upload
            upload_url = f"{self.storage_url}/object/{self.bucket_name}/{file_path}"
            
            # Headers pour l'upload
            upload_headers = {
                **self.headers,
                'Content-Type': content_type
            }
            
            # Reset file pointer
            file_data.seek(0)
            
            # Upload le fichier
            response = requests.post(
                upload_url,
                headers=upload_headers,
                data=file_data,
                params={'upsert': 'true'}  # Permet d'écraser le fichier s'il existe
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"File uploaded successfully: {file_path}")
                return file_path
            else:
                logger.error(f"Upload failed with status {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Unexpected error uploading {file_path}: {e}")
            return None
    
    async def download_file(self, file_path: str) -> Optional[bytes]:
        """Télécharge un fichier depuis Supabase Storage via REST API"""
        try:
            # URL pour le téléchargement
            download_url = f"{self.storage_url}/object/{self.bucket_name}/{file_path}"
            
            response = requests.get(download_url, headers=self.headers)
            
            if response.status_code == 200:
                logger.info(f"File downloaded successfully: {file_path}")
                return response.content
            else:
                logger.error(f"Download failed for {file_path}: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Unexpected error downloading {file_path}: {e}")
            return None
    
    async def delete_file(self, file_path: str) -> bool:
        """Supprime un fichier du stockage via REST API"""
        try:
            # URL pour la suppression
            delete_url = f"{self.storage_url}/object/{self.bucket_name}"
            
            # Body avec la liste des fichiers à supprimer
            delete_data = {
                "prefixes": [file_path]
            }
            
            response = requests.delete(
                delete_url,
                headers=self.headers,
                json=delete_data
            )
            
            if response.status_code in [200, 204]:
                logger.info(f"File deleted successfully: {file_path}")
                return True
            else:
                logger.error(f"Delete failed for {file_path}: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Unexpected error deleting {file_path}: {e}")
            return False
    
    async def get_download_url(self, file_path: str, expires_in: int = 3600) -> Optional[str]:
        """Génère une URL de téléchargement temporaire via REST API"""
        try:
            # URL pour générer une URL signée
            signed_url_endpoint = f"{self.storage_url}/object/sign/{self.bucket_name}/{file_path}"
            
            sign_data = {"expiresIn": expires_in}
            
            response = requests.post(
                signed_url_endpoint,
                headers=self.headers,
                json=sign_data
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'signedURL' in result:
                    signed_url = f"{self.supabase_url}{result['signedURL']}"
                    logger.info(f"Download URL generated for: {file_path}")
                    return signed_url
            
            # Fallback: URL publique (si le bucket est public)
            public_url = f"{self.storage_url}/object/public/{self.bucket_name}/{file_path}"
            logger.warning(f"Using public URL fallback for: {file_path}")
            return public_url
                
        except Exception as e:
            logger.error(f"Unexpected error generating URL for {file_path}: {e}")
            return None

    async def _ensure_bucket_exists(self):
        """S'assure que le bucket existe et le crée si nécessaire"""
        try:
            # Vérifier si le bucket existe
            buckets_url = f"{self.storage_url}/bucket"
            
            response = requests.get(buckets_url, headers=self.headers)
            
            if response.status_code == 200:
                buckets = response.json()
                bucket_names = [bucket['name'] for bucket in buckets]
                
                if self.bucket_name in bucket_names:
                    logger.info(f"Bucket '{self.bucket_name}' already exists")
                    return
            
            # Créer le bucket s'il n'existe pas
            logger.info(f"Creating bucket '{self.bucket_name}'...")
            
            create_data = {
                "name": self.bucket_name,
                "public": True,  # Bucket public pour éviter les problèmes RLS
                "allowedMimeTypes": ["text/csv", "application/json", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
                "fileSizeLimit": 50 * 1024 * 1024  # 50MB
            }
            
            create_response = requests.post(
                buckets_url,
                headers=self.headers,
                json=create_data
            )
            
            if create_response.status_code in [200, 201]:
                logger.info(f"Bucket '{self.bucket_name}' created successfully")
            else:
                logger.warning(f"Failed to create bucket: {create_response.status_code} - {create_response.text}")
                
        except Exception as e:
            logger.error(f"Error ensuring bucket exists: {e}")
            # Continue anyway - l'upload peut marcher même si cette vérification échoue


# Alias pour compatibilité avec le code existant
SupabaseStorageService = SimpleSupabaseStorage
storage_service = SimpleSupabaseStorage()
