"""Simplified deflection calculator for demo"""

from typing import Dict, Any
from models.responses import DeflectionResponse, ImpactClassification

class DeflectionCalculator:
    """Simple deflection calculator without complex dependencies"""
    
    def calculate_deflection(self, delta_v_cm_s: float, lead_time_years: float,
                           method: str, asteroid_diameter_m: float) -> Dict[str, Any]:
        """Calculate simplified deflection effects"""
        
        # Simple deflection calculation
        corridor_shift_km = delta_v_cm_s * lead_time_years * 365 * 24 * 3600 / 100000  # Rough approximation
        
        # Probability reduction based on shift
        if corridor_shift_km > 12000:  # Earth diameter
            impact_probability_drop = 0.99
            classification = ImpactClassification.miss
        elif corridor_shift_km > 1000:
            impact_probability_drop = 0.8
            classification = ImpactClassification.clear
        else:
            impact_probability_drop = 0.3
            classification = ImpactClassification.hit
        
        return {
            "corridor_shift_km": corridor_shift_km,
            "impact_probability_drop": impact_probability_drop,
            "classification": classification,
            "new_trajectory": {"shifted": True},
            "mission_feasibility": {"feasible": True}
        }