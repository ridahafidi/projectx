"""Simple population analyzer for demo"""

import asyncio
from typing import Dict, Any, List

class PopulationAnalyzer:
    """Simple population analyzer without complex GIS data for demo"""
    
    def __init__(self):
        self.ready = False
        
    async def load_population_data(self):
        """Load population data"""
        self.ready = True
        
    def is_ready(self) -> bool:
        """Check if population data is loaded"""
        return self.ready
        
    def analyze_exposure(self, lat: float, lon: float, effect_zones: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze population exposure for given coordinates and effect zones"""
        # Simple population estimate based on coordinates
        # Urban areas have higher population density
        base_density = 1000  # people per km²
        
        exposure_data = []
        total_affected = 0
        
        for zone in effect_zones:
            if "radius_km_samples" in zone:
                # For numpy arrays from Monte Carlo, take median
                if hasattr(zone["radius_km_samples"], "__len__") and len(zone["radius_km_samples"]) > 1:
                    radius_km = zone["radius_km_samples"][len(zone["radius_km_samples"])//2]
                else:
                    radius_km = float(zone["radius_km_samples"])
            else:
                radius_km = 1.0  # Default radius
                
            area_km2 = 3.14159 * radius_km**2
            affected_population = int(area_km2 * base_density)
            total_affected += affected_population
            
            exposure_data.append({
                "threshold": f"{zone['type']}_{zone['threshold']}",
                "count": {
                    "p5": int(affected_population * 0.7),
                    "p50": affected_population,
                    "p95": int(affected_population * 1.3)
                }
            })
            
        return {
            "population": exposure_data,
            "total_affected": {
                "p5": int(total_affected * 0.7),
                "p50": total_affected,
                "p95": int(total_affected * 1.3)
            }
        }
        
    async def calculate_exposure(self, lat: float, lon: float, effect_zones: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate population exposure (async version of analyze_exposure)"""
        return self.analyze_exposure(lat, lon, effect_zones)