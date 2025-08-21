import os
from typing import Optional
from datetime import timedelta
from supabase import create_client, Client

# Expected env vars:
# SUPABASE_URL, SUPABASE_KEY (service role on server), SUPABASE_BUCKET_NAME
# Do NOT expose service role key to mobile clients.

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET_NAME", "synthetic-datasets")


class SupabaseStorage:
    def __init__(self) -> None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError("Supabase env vars missing: SUPABASE_URL / SUPABASE_KEY")
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.bucket = SUPABASE_BUCKET

    def upload_bytes(self, path: str, data: bytes, content_type: Optional[str] = None) -> str:
        """
        Uploads bytes to storage at the given path. Overwrites if exists.
        Returns the storage path.
        """
        # supabase-py v2 uses storage.from_(bucket)
        # Note: If your SDK lacks upsert, delete existing then upload or version file name.
        self.client.storage.from_(self.bucket).upload(
            path=path,
            file=data,
            file_options={"content-type": content_type or "application/octet-stream", "upsert": True},
        )
        return path

    def download_bytes(self, path: str) -> bytes:
        """
        Downloads object bytes from storage at the given path.
        """
        res = self.client.storage.from_(self.bucket).download(path)
        # supabase-py returns bytes for download
        return res

    def create_signed_url(self, path: str, expires_in_seconds: int = 3600) -> str:
        """
        Creates a signed URL for the given storage path.
        """
        res = self.client.storage.from_(self.bucket).create_signed_url(path, expires_in_seconds)
        # res is typically {'signedURL': '...'} in supabase-py v2
        if isinstance(res, dict) and "signedURL" in res:
            return res["signedURL"]
        # Some client versions return a plain string
        return str(res)

    def delete_file(self, path: str) -> bool:
        """
        Deletes a file from storage at the given path.
        Returns True if successful, False otherwise.
        """
        try:
            res = self.client.storage.from_(self.bucket).remove([path])
            return True
        except Exception as e:
            print(f"Error deleting file {path}: {e}")
            return False