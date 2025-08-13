"""
Service pour gérer l'upload et la validation des datasets
"""
import os
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from fastapi import UploadFile, HTTPException
import uuid
from datetime import datetime
import json


class DatasetUploadService:
    
    ALLOWED_EXTENSIONS = {'.csv', '.json', '.xlsx', '.parquet'}
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    MIN_ROWS = 10
    MAX_ROWS = 100000
    
    def __init__(self, upload_dir: str = "data/datasets"):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)
    
    async def validate_and_save_dataset(self, file: UploadFile, user_id: int) -> Dict[str, Any]:
        """
        Valide et sauvegarde un dataset uploadé
        """
        # Validation de base
        if not file.filename:
            raise HTTPException(status_code=400, detail="Nom de fichier manquant")
        
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in self.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Format de fichier non supporté. Formats acceptés: {', '.join(self.ALLOWED_EXTENSIONS)}"
            )
        
        # Lire le contenu du fichier
        content = await file.read()
        if len(content) > self.MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 50MB)")
        
        # Générer un nom unique pour le fichier
        unique_filename = f"{user_id}_{uuid.uuid4().hex}_{file.filename}"
        file_path = os.path.join(self.upload_dir, unique_filename)
        
        # Sauvegarder le fichier
        with open(file_path, "wb") as f:
            f.write(content)
        
        try:
            # Analyser le dataset
            df = self._load_dataframe(file_path, file_ext)
            analysis = self._analyze_dataset(df)
            
            return {
                "file_path": file_path,
                "original_filename": file.filename,
                "unique_filename": unique_filename,
                "file_size": len(content),
                "analysis": analysis
            }
            
        except Exception as e:
            # Nettoyer le fichier en cas d'erreur
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=400, detail=f"Erreur lors de l'analyse du dataset: {str(e)}")
    
    def _load_dataframe(self, file_path: str, file_ext: str) -> pd.DataFrame:
        """Charge un DataFrame selon l'extension du fichier"""
        try:
            if file_ext == '.csv':
                df = pd.read_csv(file_path)
            elif file_ext == '.json':
                df = pd.read_json(file_path)
            elif file_ext == '.xlsx':
                df = pd.read_excel(file_path)
            elif file_ext == '.parquet':
                df = pd.read_parquet(file_path)
            else:
                raise ValueError(f"Extension non supportée: {file_ext}")
            
            return df
        except Exception as e:
            raise ValueError(f"Impossible de lire le fichier: {str(e)}")
    
    def _analyze_dataset(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyse un dataset et retourne des statistiques"""
        n_rows, n_cols = df.shape
        
        # Validation des contraintes
        if n_rows < self.MIN_ROWS:
            raise ValueError(f"Dataset trop petit (minimum {self.MIN_ROWS} lignes)")
        if n_rows > self.MAX_ROWS:
            raise ValueError(f"Dataset trop volumineux (maximum {self.MAX_ROWS} lignes)")
        
        # Analyse des colonnes
        column_info = {}
        for col in df.columns:
            dtype = str(df[col].dtype)
            null_count = df[col].isnull().sum()
            unique_count = df[col].nunique()
            
            # Déterminer le type de colonne
            if df[col].dtype in ['object', 'string']:
                col_type = 'categorical'
            elif df[col].dtype in ['int64', 'int32', 'float64', 'float32']:
                col_type = 'numerical'
            elif df[col].dtype in ['datetime64[ns]', 'datetime']:
                col_type = 'datetime'
            else:
                col_type = 'other'
            
            column_info[col] = {
                'dtype': dtype,
                'type': col_type,
                'null_count': int(null_count),
                'null_percentage': float(null_count / n_rows * 100),
                'unique_count': int(unique_count),
                'sample_values': df[col].dropna().head(5).tolist()
            }
        
        return {
            'n_rows': n_rows,
            'n_columns': n_cols,
            'columns': list(df.columns),
            'column_info': column_info,
            'memory_usage': df.memory_usage(deep=True).sum(),
            'has_nulls': df.isnull().any().any(),
            'total_nulls': int(df.isnull().sum().sum())
        }
    
    def get_dataset_preview(self, file_path: str, n_rows: int = 10) -> Dict[str, Any]:
        """Retourne un aperçu du dataset"""
        try:
            file_ext = os.path.splitext(file_path)[1].lower()
            df = self._load_dataframe(file_path, file_ext)
            
            preview = df.head(n_rows)
            
            return {
                'preview': preview.to_dict('records'),
                'columns': list(df.columns),
                'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
                'shape': df.shape
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Erreur lors de la lecture du dataset: {str(e)}")
    
    def cleanup_file(self, file_path: str):
        """Supprime un fichier uploadé"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Erreur lors de la suppression du fichier {file_path}: {e}")
