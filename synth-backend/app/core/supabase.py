from supabase import create_client
import os
from app.core.config import settings

supabase = create_client(
    supabase_url=settings.SUPABASE_URL,
    supabase_key=settings.SUPABASE_ANON_KEY  # Use service role key for backend operations
)