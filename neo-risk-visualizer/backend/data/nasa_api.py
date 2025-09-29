"""Simple NASA data provider for demo"""

import asyncio
from typing import Dict, Any, List

class NASADataProvider:
    """Simple NASA data provider without external API calls for demo"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key  # Accept but don't use for demo
        self.cache = {}
        
    async def initialize_cache(self):
        """Initialize data cache"""
        self.cache["asteroids"] = [
            {"name": "2022 AP7", "diameter_m": 1500, "velocity_km_s": 22.3},
            {"name": "2021 PH27", "diameter_m": 1000, "velocity_km_s": 20.1},
            {"name": "Demo Asteroid", "diameter_m": 150, "velocity_km_s": 25.0}
        ]
        
    async def check_connection(self) -> bool:
        """Check if NASA API is accessible"""
        return True  # Always return true for demo
        
    async def get_asteroids(self, limit: int = 50, min_diameter: float = 10) -> List[Dict[str, Any]]:
        """Get asteroid data"""
        return self.cache.get("asteroids", [])