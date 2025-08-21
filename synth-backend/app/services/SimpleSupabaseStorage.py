"""
Service de stockage Supabase simplifié pour éviter les problèmes de compatibilité
"""
import os
import asyncio
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
    
    async def download_file(self, file_path: str, max_retries: int = 3) -> Optional[bytes]:
        """Télécharge un fichier depuis Supabase Storage via REST API avec retries et fallbacks"""
        if not file_path:
            logger.error("Attempted to download a file with empty file_path")
            return None
            
        # 1. Première vérification: le chemin est-il valide?
        if not file_path.strip():
            logger.error("File path is empty or contains only whitespace")
            return None
            
        # 2. Vérifier si le fichier existe
        file_exists = await self.check_file_exists(file_path)
        if not file_exists:
            logger.warning(f"File {file_path} doesn't exist in Supabase storage. Checking alternatives...")
            
            # On pourrait implémenter une recherche alternative ici
            # Par exemple, rechercher des fichiers avec un nom similaire
            
        # 3. Tentative de téléchargement direct via API
        for attempt in range(max_retries):
            try:
                logger.info(f"Downloading file attempt {attempt+1}/{max_retries}: {file_path}")
                
                # URL pour le téléchargement
                download_url = f"{self.storage_url}/object/{self.bucket_name}/{file_path}"
                logger.debug(f"Download URL: {download_url}")
                
                # Log des headers (sans les clés sensibles)
                safe_headers = {k: '***' if k in ['Authorization', 'apikey'] else v for k, v in self.headers.items()}
                logger.debug(f"Request headers: {safe_headers}")
                
                # Effectuer la requête avec timeout pour éviter les blocages
                response = requests.get(download_url, headers=self.headers, timeout=30)
                
                if response.status_code == 200:
                    content_length = len(response.content)
                    logger.info(f"✅ File downloaded successfully: {file_path} ({content_length} bytes)")
                    
                    # Vérifier que le contenu n'est pas vide
                    if content_length == 0:
                        logger.warning(f"⚠️ Downloaded file is empty: {file_path}")
                    
                    return response.content
                elif response.status_code == 404:
                    logger.error(f"❌ File not found in Supabase storage: {file_path}")
                    break  # Pas besoin de réessayer si le fichier n'existe pas
                else:
                    logger.error(f"Download failed for {file_path}: Status {response.status_code} - Response: {response.text[:200]}")
                    # On va réessayer
                    await asyncio.sleep(1)  # Pause avant de réessayer
                    
            except requests.exceptions.Timeout:
                logger.error(f"Timeout while downloading {file_path} from Supabase (attempt {attempt+1})")
                await asyncio.sleep(1)
            except requests.exceptions.ConnectionError:
                logger.error(f"Connection error while downloading {file_path} from Supabase (attempt {attempt+1})")
                await asyncio.sleep(2)
            except Exception as e:
                logger.error(f"Unexpected error downloading {file_path}: {str(e)}", exc_info=True)
                await asyncio.sleep(1)
                
        # 4. Solution de secours : téléchargement via URL signée
        logger.info(f"Trying fallback - download via signed URL for: {file_path}")
        try:
            url = await self.get_download_url(file_path)
            if url:
                logger.info(f"Got signed URL for {file_path}, trying to download...")
                content = await self.download_file_from_url(url)
                if content:
                    logger.info(f"Successfully downloaded {file_path} using signed URL")
                    return content
                else:
                    logger.error(f"Failed to download {file_path} using signed URL")
        except Exception as e:
            logger.error(f"Error in fallback download for {file_path}: {str(e)}")
            
        logger.error(f"All download attempts failed for file: {file_path}")
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
    
    async def check_file_exists(self, file_path: str) -> bool:
        """Vérifie si un fichier existe dans Supabase Storage avec retry et méthodes alternatives"""
        if not file_path or not file_path.strip():
            logger.error("Attempted to check existence of a file with empty file_path")
            return False
            
        # Méthode 1: Vérification avec HEAD
        try:
            check_url = f"{self.storage_url}/object/{self.bucket_name}/{file_path}"
            logger.info(f"Checking if file exists using HEAD: {file_path}")
            
            response = requests.head(check_url, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                logger.info(f"File exists in storage (HEAD check): {file_path}")
                return True
            else:
                logger.warning(f"HEAD check: File may not exist: {file_path} (status: {response.status_code})")
                # Continuer avec d'autres méthodes
        except Exception as e:
            logger.error(f"Error during HEAD check for {file_path}: {str(e)}")
            # Continuer avec d'autres méthodes
            
        # Méthode 2: Liste des fichiers dans le dossier
        try:
            # Extraire le dossier du chemin de fichier
            folder_path = os.path.dirname(file_path)
            filename = os.path.basename(file_path)
            
            list_url = f"{self.storage_url}/object/list/{self.bucket_name}"
            if folder_path:
                params = {"prefix": folder_path}
            else:
                params = {}
                
            logger.info(f"Checking file existence via folder listing for: {file_path}")
            response = requests.get(list_url, headers=self.headers, params=params, timeout=15)
            
            if response.status_code == 200:
                files = response.json()
                for file_info in files:
                    if file_info.get('name') == filename or file_info.get('name') == file_path:
                        logger.info(f"File exists (folder listing): {file_path}")
                        return True
                    
                logger.warning(f"File not found in folder listing: {file_path}")
            else:
                logger.error(f"Failed to list files in folder {folder_path}: {response.status_code}")
        except Exception as e:
            logger.error(f"Error checking file list for {file_path}: {str(e)}")
        
        # Méthode 3: Essai de téléchargement de 1 octet
        try:
            range_headers = self.headers.copy()
            range_headers['Range'] = 'bytes=0-0'  # Juste le premier octet
            
            download_url = f"{self.storage_url}/object/{self.bucket_name}/{file_path}"
            logger.info(f"Checking file existence via 1-byte download: {file_path}")
            
            response = requests.get(download_url, headers=range_headers, timeout=10)
            
            if response.status_code in [200, 206]:  # 206 = Partial Content (succès)
                logger.info(f"File exists (1-byte download): {file_path}")
                return True
        except Exception as e:
            logger.error(f"Error during 1-byte download check for {file_path}: {str(e)}")
            
        # Si toutes les méthodes ont échoué, le fichier n'existe probablement pas
        logger.error(f"⚠️ File does not exist after multiple verification methods: {file_path}")
        return False
            
    async def get_download_url(self, file_path: str, expires_in: int = 3600) -> Optional[str]:
        """Génère une URL de téléchargement temporaire via REST API"""
        try:
            # Vérifier d'abord si le fichier existe
            file_exists = await self.check_file_exists(file_path)
            if not file_exists:
                logger.warning(f"Cannot generate download URL for non-existent file: {file_path}")
                return None
                
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
            
    async def download_file_from_url(self, url: str, max_retries: int = 3) -> Optional[bytes]:
        """Télécharger un fichier à partir d'une URL (solution de secours)"""
        if not url:
            logger.error("Attempted to download from empty URL")
            return None
            
        for retry in range(max_retries):
            try:
                logger.info(f"Downloading file from URL (attempt {retry+1}/{max_retries}): {url}")
                
                # Ajouter les headers d'autorisation si l'URL est sur Supabase
                headers = {}
                if self.supabase_url in url:
                    headers = self.headers
                
                # Télécharger le fichier avec timeout
                response = requests.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    content_length = len(response.content)
                    logger.info(f"File downloaded from URL successfully ({content_length} bytes)")
                    return response.content
                else:
                    logger.warning(f"Download from URL failed (status {response.status_code}): {response.text[:200]}")
                    
            except requests.exceptions.Timeout:
                logger.warning(f"Timeout downloading from URL (attempt {retry+1})")
            except requests.exceptions.ConnectionError:
                logger.warning(f"Connection error downloading from URL (attempt {retry+1})")
            except Exception as e:
                logger.error(f"Unexpected error downloading from URL: {str(e)}")
                
            # Attendre un peu avant de réessayer
            await asyncio.sleep(1)
        
        logger.error(f"Failed to download file after {max_retries} attempts from URL: {url}")
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
