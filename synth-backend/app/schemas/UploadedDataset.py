from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class UploadedDatasetBase(BaseModel):
    original_filename: str
    n_rows: int
    n_columns: int
    columns: List[str]


class UploadedDatasetCreate(UploadedDatasetBase):
    unique_filename: str
    file_path: str
    file_size: int
    column_info: Dict[str, Any]
    memory_usage: Optional[int] = None
    has_nulls: bool = False
    total_nulls: int = 0


class UploadedDatasetOut(UploadedDatasetBase):
    id: int
    user_id: int
    unique_filename: str
    file_size: int
    column_info: Dict[str, Any]
    memory_usage: Optional[int]
    has_nulls: bool
    total_nulls: int
    is_valid: bool
    validation_errors: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DatasetPreviewRequest(BaseModel):
    dataset_id: int
    n_rows: int = Field(default=10, ge=1, le=100)


class DatasetPreviewResponse(BaseModel):
    preview: List[Dict[str, Any]]
    columns: List[str]
    dtypes: Dict[str, str]
    shape: tuple


class GenerationRequestBase(BaseModel):
    request_name: str = Field(..., min_length=1, max_length=255)
    n_samples: int = Field(..., ge=10, le=100000)


class GenerationRequestCreate(GenerationRequestBase):
    uploaded_dataset_id: int


class GenerationRequestOut(GenerationRequestBase):
    id: int
    user_id: int
    uploaded_dataset_id: int
    status: str
    progress: float
    output_file_path: Optional[str]
    supabase_url: Optional[str]
    quality_score: Optional[float]
    generation_time: Optional[float]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True
