"""
Middleware de logging et monitoring des performances
"""
import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import json

logger = logging.getLogger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware pour logger les requêtes HTTP"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Log de la requête entrante
        logger.info(
            f"Incoming request: {request.method} {request.url} "
            f"from {request.client.host if request.client else 'unknown'}"
        )
        
        # Traiter la requête
        try:
            response = await call_next(request)
            
            # Calculer le temps de traitement
            process_time = time.time() - start_time
            
            # Log de la réponse
            logger.info(
                f"Request completed: {request.method} {request.url} "
                f"Status: {response.status_code} "
                f"Duration: {process_time:.3f}s"
            )
            
            # Ajouter le temps de traitement dans les headers
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"Request failed: {request.method} {request.url} "
                f"Error: {str(e)} "
                f"Duration: {process_time:.3f}s"
            )
            raise

class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware pour surveiller les performances"""
    
    def __init__(self, app, slow_request_threshold: float = 1.0):
        super().__init__(app)
        self.slow_request_threshold = slow_request_threshold
        self.request_stats = {
            "total_requests": 0,
            "slow_requests": 0,
            "errors": 0,
            "avg_response_time": 0
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Traiter la requête
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Mettre à jour les statistiques
            self._update_stats(process_time, False)
            
            # Alerter pour les requêtes lentes
            if process_time > self.slow_request_threshold:
                logger.warning(
                    f"Slow request detected: {request.method} {request.url} "
                    f"took {process_time:.3f}s (threshold: {self.slow_request_threshold}s)"
                )
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            self._update_stats(process_time, True)
            raise
    
    def _update_stats(self, response_time: float, is_error: bool):
        """Met à jour les statistiques de performance"""
        self.request_stats["total_requests"] += 1
        
        if is_error:
            self.request_stats["errors"] += 1
        
        if response_time > self.slow_request_threshold:
            self.request_stats["slow_requests"] += 1
        
        # Calculer la moyenne mobile du temps de réponse
        current_avg = self.request_stats["avg_response_time"]
        total_requests = self.request_stats["total_requests"]
        
        # Moyenne mobile simple
        new_avg = ((current_avg * (total_requests - 1)) + response_time) / total_requests
        self.request_stats["avg_response_time"] = new_avg
    
    def get_stats(self) -> dict:
        """Retourne les statistiques actuelles"""
        return self.request_stats.copy()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware pour ajouter des headers de sécurité"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Ajouter les headers de sécurité
        security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        }
        
        for header_name, header_value in security_headers.items():
            response.headers[header_name] = header_value
        
        return response

class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Middleware pour limiter la taille des requêtes"""
    
    def __init__(self, app, max_request_size: int = 500 * 1024 * 1024):  # 500MB par défaut
        super().__init__(app)
        self.max_request_size = max_request_size
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Vérifier la taille de la requête
        content_length = request.headers.get("content-length")
        
        if content_length:
            content_length = int(content_length)
            if content_length > self.max_request_size:
                logger.warning(
                    f"Request too large: {content_length} bytes "
                    f"(max: {self.max_request_size} bytes) from {request.client.host if request.client else 'unknown'}"
                )
                return Response(
                    content=json.dumps({"error": "Request entity too large"}),
                    status_code=413,
                    media_type="application/json"
                )
        
        return await call_next(request)
