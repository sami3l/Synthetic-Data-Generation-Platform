# app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    model_config = {"env_file": ".env", "extra": "ignore"}
    
    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    ASYNC_DATABASE_URL: str = Field(..., env="ASYNC_DATABASE_URL")
    
    # JWT
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    JWT_SECRET_KEY: str = Field(..., env="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Supabase
    SUPABASE_URL: str = Field(..., env="SUPABASE_URL")
    SUPABASE_KEY: str = Field(..., env="SUPABASE_KEY")
    SUPABASE_ANON_KEY: str = Field(..., env="SUPABASE_ANON_KEY")
    SUPABASE_BUCKET_NAME: str = Field(default="synthetic-datasets", env="SUPABASE_BUCKET_NAME")
    
    # Application
    APP_NAME: str = Field(default="Synthetic Data Generation Platform", env="APP_NAME")
    APP_VERSION: str = Field(default="1.0.0", env="APP_VERSION")
    DEBUG: bool = Field(default=False, env="DEBUG")
    BACKEND_BASE_URL: str = Field(default="http://localhost:8000", env="BACKEND_BASE_URL")
    
    # File limits
    MAX_FILE_SIZE_MB: int = Field(default=500, env="MAX_FILE_SIZE_MB")
    SUPPORTED_FILE_TYPES: str = Field(default="csv,json,xlsx,parquet", env="SUPPORTED_FILE_TYPES")
    
    # Generation defaults
    DEFAULT_SAMPLE_SIZE: int = Field(default=1000, env="DEFAULT_SAMPLE_SIZE")
    MAX_SAMPLE_SIZE: int = Field(default=100000, env="MAX_SAMPLE_SIZE")
    DEFAULT_EPOCHS: int = Field(default=100, env="DEFAULT_EPOCHS")
    MAX_EPOCHS: int = Field(default=500, env="MAX_EPOCHS")
    
    @property
    def supported_file_types_list(self) -> list:
        return self.SUPPORTED_FILE_TYPES.split(',')

settings = Settings()