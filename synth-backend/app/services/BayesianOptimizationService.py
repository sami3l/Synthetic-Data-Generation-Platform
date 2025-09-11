import numpy as np
from typing import Dict, List, Tuple, Any
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import Matern
from scipy.optimize import minimize
from scipy.stats import norm
import json

class BayesianOptimizationService:
    def __init__(self, acquisition_function: str = "expected_improvement"):
        self.acquisition_function = acquisition_function
        self.gp = GaussianProcessRegressor(
            kernel=Matern(length_scale=1.0, nu=2.5),
            alpha=1e-6,
            normalize_y=True,
            n_restarts_optimizer=5,
            random_state=42
        )
        self.X_observed = []
        self.y_observed = []
        self.bounds = []
        self.param_names = []

    def set_search_space(self, search_space: Dict[str, Any]):
        """Configure l'espace de recherche"""
        self.bounds = []
        self.param_names = []
        
        for param_name, param_config in search_space.items():
            if isinstance(param_config, dict):
                if "min_value" in param_config and "max_value" in param_config:
                    # Paramètre continu
                    self.bounds.append((param_config["min_value"], param_config["max_value"]))
                    self.param_names.append(param_name)
                elif "choices" in param_config:
                    # Paramètre catégoriel - convertir en indices
                    self.bounds.append((0, len(param_config["choices"]) - 1))
                    self.param_names.append(param_name)

    def suggest_next_parameters(self) -> Dict[str, Any]:
        """Suggère les prochains paramètres à tester"""
        if len(self.X_observed) < 2:
            # Random sampling pour les premiers points
            return self._random_sample()
        
        # Fit le modèle gaussien
        X = np.array(self.X_observed)
        y = np.array(self.y_observed)
        self.gp.fit(X, y)
        
        # Optimiser la fonction d'acquisition
        best_x = self._optimize_acquisition()
        
        # Convertir en paramètres nommés
        return self._array_to_params(best_x)

    def update_observations(self, parameters: Dict[str, Any], score: float):
        """Met à jour les observations avec un nouveau résultat"""
        x = self._params_to_array(parameters)
        self.X_observed.append(x)
        self.y_observed.append(score)

    def _optimize_acquisition(self) -> np.ndarray:
        """Optimise la fonction d'acquisition"""
        best_x = None
        best_acquisition = -np.inf
        
        # Multi-start optimization
        for _ in range(10):
            x0 = self._random_sample_array()
            res = minimize(
                fun=lambda x: -self._acquisition_function(x.reshape(1, -1)),
                x0=x0,
                bounds=self.bounds,
                method='L-BFGS-B'
            )
            
            if res.success and -res.fun > best_acquisition:
                best_acquisition = -res.fun
                best_x = res.x
        
        return best_x if best_x is not None else self._random_sample_array()

    def _acquisition_function(self, X: np.ndarray) -> float:
        """Calcule la valeur de la fonction d'acquisition"""
        mu, sigma = self.gp.predict(X, return_std=True)
        
        if self.acquisition_function == "expected_improvement":
            best_f = np.max(self.y_observed)
            z = (mu - best_f) / (sigma + 1e-9)
            return sigma * (z * norm.cdf(z) + norm.pdf(z))
        
        elif self.acquisition_function == "upper_confidence_bound":
            kappa = 2.576  # 99% confidence
            return mu + kappa * sigma
        
        elif self.acquisition_function == "probability_improvement":
            best_f = np.max(self.y_observed)
            z = (mu - best_f) / (sigma + 1e-9)
            return norm.cdf(z)
        
        return mu

    def _random_sample(self) -> Dict[str, Any]:
        """Échantillonnage aléatoire"""
        x = self._random_sample_array()
        return self._array_to_params(x)

    def _random_sample_array(self) -> np.ndarray:
        """Échantillonnage aléatoire sous forme de tableau"""
        return np.array([
            np.random.uniform(low, high) 
            for low, high in self.bounds
        ])

    def _params_to_array(self, parameters: Dict[str, Any]) -> List[float]:
        """Convertit les paramètres en tableau"""
        return [parameters.get(name, 0) for name in self.param_names]

    def _array_to_params(self, x: np.ndarray) -> Dict[str, Any]:
        """Convertit un tableau en paramètres nommés"""
        params = {}
        for i, name in enumerate(self.param_names):
            params[name] = x[i]
        return params