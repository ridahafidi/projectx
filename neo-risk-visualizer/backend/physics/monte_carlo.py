"""Monte Carlo uncertainty propagation for impact simulations"""

import numpy as np
from typing import List, Dict, Any

class MonteCarloSimulator:
    """Handle uncertainty propagation through Monte Carlo sampling"""
    
    def __init__(self, n_samples: int = 1000):
        self.n_samples = n_samples
        np.random.seed(42)  # Reproducible results for demo
    
    def add_uncertainty(self, mean_value: float, relative_uncertainty: float) -> np.ndarray:
        """
        Add uncertainty to a parameter using log-normal distribution
        
        Args:
            mean_value: Central value
            relative_uncertainty: Fractional uncertainty (e.g., 0.1 = 10%)
        
        Returns:
            Array of samples with uncertainty
        """
        if relative_uncertainty <= 0:
            return np.full(self.n_samples, mean_value)
        
        # Log-normal distribution preserves positive values and is realistic for physical parameters
        sigma = np.log(1 + relative_uncertainty)
        mu = np.log(mean_value) - 0.5 * sigma**2
        
        samples = np.random.lognormal(mu, sigma, self.n_samples)
        return samples
    
    def correlate_parameters(self, param1: np.ndarray, param2: np.ndarray, 
                            correlation: float = 0.0) -> tuple:
        """
        Add correlation between two parameter arrays
        
        Args:
            param1, param2: Parameter sample arrays
            correlation: Correlation coefficient (-1 to 1)
        
        Returns:
            Tuple of correlated parameter arrays
        """
        if abs(correlation) < 0.01:
            return param1, param2
        
        # Use Cholesky decomposition for correlation
        mean1, mean2 = np.mean(param1), np.mean(param2)
        std1, std2 = np.std(param1), np.std(param2)
        
        # Standardize
        z1 = (param1 - mean1) / std1
        z2 = (param2 - mean2) / std2
        
        # Apply correlation
        z2_corr = correlation * z1 + np.sqrt(1 - correlation**2) * z2
        
        # Transform back
        param2_corr = z2_corr * std2 + mean2
        
        return param1, param2_corr