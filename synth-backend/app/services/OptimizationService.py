from sqlalchemy.orm import Session
from app.models.OptimizationConfig import OptimizationConfig
from app.models.OptimizationTrial import OptimizationTrial
from app.models.DataRequest import DataRequest
from datetime import datetime
import random

class OptimizationService:
    def run_optimization(self, db: Session, config_id: int):
        """Exécute le processus d'optimisation pour une configuration donnée."""
        config = db.query(OptimizationConfig).filter(OptimizationConfig.id == config_id).first()

        if not config:
            raise ValueError("Optimization config not found")

        # Simuler le processus d'optimisation
        for trial_number in range(1, config.max_evaluations + 1):
            # Générer des paramètres aléatoires (simulation)
            parameters = {
                "param1": random.uniform(0, 1),
                "param2": random.uniform(0, 1),
                "param3": random.uniform(0, 1),
            }

            # Calculer un score de qualité (simulation)
            quality_score = self.evaluate_parameters(parameters)

            # Créer un essai d'optimisation
            trial = OptimizationTrial(
                config_id=config_id,
                trial_number=trial_number,
                parameters=parameters,
                quality_score=quality_score,
                created_at=datetime.utcnow()
            )

            db.add(trial)
            db.commit()

        # Mettre à jour le statut de la configuration
        config.status = "completed"
        config.completed_at = datetime.utcnow()
        db.commit()

    def evaluate_parameters(self, parameters: dict) -> float:
        """Évalue les paramètres et retourne un score de qualité (simulation)."""
        # Exemple : la somme des paramètres comme score de qualité
        return sum(parameters.values())
