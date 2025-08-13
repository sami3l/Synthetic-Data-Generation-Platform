#DatasetCreate  and DatasetOut schemas
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
class DatasetCreate(BaseModel):
    name: str = Field(..., example="My Dataset")
    description: Optional[str] = Field(None, example="A brief description of the dataset")
    created_at: datetime = Field(default_factory=datetime.utcnow)
class DatasetOut(DatasetCreate):
    id: int = Field(..., example=1)
    user_id: int = Field(..., example=1)
    file_name: str = Field(..., example="dataset.csv")
    storage_path: str = Field(..., example="path/to/dataset.csv")
    bucket_name: str = Field(..., example="my-bucket")
    file_size: int = Field(..., example=1024)
    download_url: str = Field(..., example="https://example.com/download/dataset.csv")
    url_expires_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = Field(None, example={"rows": 1000, "columns": ["feature1", "feature2"]})
class DatasetUpdate(BaseModel):
    name: Optional[str] = Field(None, example="Updated Dataset Name")
    description: Optional[str] = Field(None, example="Updated description of the dataset")
    metadata: Optional[Dict[str, Any]] = Field(None, example={"rows": 2000, "columns": ["feature1", "feature2", "feature3"]})
class DatasetDelete(BaseModel):
    id: int = Field(..., example=1)
    user_id: int = Field(..., example=1)
