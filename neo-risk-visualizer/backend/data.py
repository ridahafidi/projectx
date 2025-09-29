# data/__init__.py
# Empty init file

# data/nasa_api.py
"""
NASA CNEOS/SBDB API integration for asteroid data
Fetch real asteroid parameters and orbital data
"""

import httpx
import asyncio
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import os
from cachetools import TTLCache

logger = logging.getLogger(__name__)

class NASADataProvider:
    """Interface to NASA CNEOS and SBDB APIs"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.base_urls = {
            "cneos": "https://ssd-api.jpl.nasa.gov/cneos_api",
            "sbdb": "https://ssd-api.jpl.nasa.gov/sbdb.api",
            "cad": "https://ssd-api.jpl.nasa.gov/cad.api"  # Close Approach Data
        }
        
        # Cache for 1 hour to avoid hammering NASA APIs
        self.cache = TTLCache(maxsize=1000, ttl=3600)
        self.client = httpx.AsyncClient(timeout=30.0)
        
        # Ensure cache directory exists
        self.cache_dir = "data/cache"
        os.makedirs(self.cache_dir, exist_ok=True)
    
    async def initialize_cache(self):
        """Initialize local cache with commonly used data"""
        logger.info("Initializing NASA data cache...")
        
        try:
            # Load potentially hazardous asteroids
            await self.get_potentially_hazardous_asteroids(limit=100)
            logger.info("NASA data cache initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize NASA data cache: {e}")
    
    async def check_connection(self) -> bool:
        """Check if NASA APIs are accessible"""
        try:
            response = await self.client.get(f"{self.base_urls['sbdb']}?des=433")  # Eros
            return response.status_code == 200
        except Exception:
            return False
    
    async def get_potentially_hazardous_asteroids(self, limit: int = 50, 
                                                 min_diameter_m: float = 10.0) -> List[Dict[str, Any]]:
        """
        Fetch potentially hazardous asteroids from NASA SBDB
        
        Args:
            limit: Maximum number of asteroids to return
            min_diameter_m: Minimum diameter in meters
        
        Returns:
            List of asteroid dictionaries with orbital and physical parameters
        """
        cache_key = f"pha_{limit}_{min_diameter_m}"
        
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            # Query SBDB for PHAs (Potentially Hazardous Asteroids)
            params = {
                "fields": "spkid,full_name,diameter,H,albedo,rot_per,GM,BV,UB,IR,spec_B,spec_T,neo,pha,class",
                "sb-clas": "IEO,ATE,APO,AMO",  # Near-Earth object classes
                "sb-kind": "a",  # Asteroids only
                "limit": str(limit * 2),  # Get more to filter by size
            }
            
            response = await self.client.get(self.base_urls["sbdb"], params=params)
            response.raise_for_status()
            data = response.json()
            
            asteroids = []
            
            if "data" in data:
                for row in data["data"]:
                    asteroid = self._parse_sbdb_row(row, data["fields"])
                    
                    # Filter by minimum diameter
                    if asteroid.get("diameter_m", 0) >= min_diameter_m:
                        asteroids.append(asteroid)
                    
                    if len(asteroids) >= limit:
                        break
            
            # Add some default asteroids if we don't have enough real data
            if len(asteroids) < 10:
                asteroids.extend(self._get_default_asteroids())
            
            self.cache[cache_key] = asteroids
            logger.info(f"Fetched {len(asteroids)} potentially hazardous asteroids")
            
            return asteroids
            
        except Exception as e:
            logger.error(f"Failed to fetch NASA asteroid data: {e}")
            # Return default asteroids as fallback
            return self._get_default_asteroids()
    
    def _parse_sbdb_row(self, row: List[Any], fields: List[str]) -> Dict[str, Any]:
        """Parse a row from SBDB API response"""
        asteroid = {}
        
        for i, field in enumerate(fields):
            value = row[i] if i < len(row) and row[i] is not None else None
            
            if field == "full_name":
                asteroid["name"] = str(value) if value else f"Asteroid {row[0] if row else 'Unknown'}"
            elif field == "spkid":
                asteroid["id"] = str(value) if value else "unknown"
            elif field == "diameter":
                # Convert km to meters
                asteroid["diameter_m"] = float(value) * 1000 if value else None
            elif field == "H":
                # Absolute magnitude - can estimate size if diameter unknown
                if value and not asteroid.get("diameter_m"):
                    asteroid["diameter_m"] = self._estimate_diameter_from_H(float(value))
                asteroid["absolute_magnitude"] = float(value) if value else None
            elif field == "albedo":
                asteroid["albedo"] = float(value) if value else 0.14  # Typical asteroid albedo
            elif field == "class":
                asteroid["spectral_class"] = str(value) if value else "unknown"
        
        # Add typical physical properties based on spectral class
        self._add_typical_properties(asteroid)
        
        return asteroid
    
    def _estimate_diameter_from_H(self, absolute_magnitude: float, albedo: float = 0.14) -> float:
        """
        Estimate asteroid diameter from absolute magnitude
        Using: D = 1329 / sqrt(albedo) * 10^(-0.2 * H) km
        """
        diameter_km = 1329 / (albedo ** 0.5) * (10 ** (-0.2 * absolute_magnitude))
        return diameter_km * 1000  # Convert to meters
    
    def _add_typical_properties(self, asteroid: Dict[str, Any]):
        """Add typical physical properties based on spectral class"""
        spectral_class = asteroid.get("spectral_class", "").upper()
        
        # Default values
        asteroid.setdefault("density_kg_m3", 2500)  # Typical rocky asteroid
        asteroid.setdefault("velocity_km_s", 20)    # Typical impact velocity
        
        # Adjust properties based on spectral class
        if spectral_class.startswith("C"):  # Carbonaceous
            asteroid["density_kg_m3"] = 1500
            asteroid["description"] = "Carbonaceous asteroid (dark, carbon-rich)"
        elif spectral_class.startswith("S"):  # Silicaceous  
            asteroid["density_kg_m3"] = 2700
            asteroid["description"] = "Stony asteroid (silicate-rich)"
        elif spectral_class.startswith("M"):  # Metallic
            asteroid["density_kg_m3"] = 5000
            asteroid["description"] = "Metallic asteroid (iron-nickel rich)"
        else:
            asteroid["description"] = "Unknown composition asteroid"
        
        # Ensure we have a diameter
        if not asteroid.get("diameter_m"):
            asteroid["diameter_m"] = 100  # Default 100m diameter
    
    def _get_default_asteroids(self) -> List[Dict[str, Any]]:
        """Return default asteroid data for demo purposes"""
        return [
            {
                "id": "2022_AP7",
                "name": "2022 AP7",
                "diameter_m": 1500,
                "density_kg_m3": 2500,
                "velocity_km_s": 22,
                "spectral_class": "S",
                "description": "Large potentially hazardous asteroid"
            },
            {
                "id": "99942_apophis",
                "name": "99942 Apophis", 
                "diameter_m": 340,
                "density_kg_m3": 3200,
                "velocity_km_s": 19,
                "spectral_class": "Sq",
                "description": "Famous potentially hazardous asteroid"
            },
            {
                "id": "101955_bennu",
                "name": "101955 Bennu",
                "diameter_m": 490,
                "density_kg_m3": 1190,
                "velocity_km_s": 18,
                "spectral_class": "B",
                "description": "OSIRIS-REx target asteroid"
            },
            {
                "id": "162173_ryugu",
                "name": "162173 Ryugu",
                "diameter_m": 900,
                "density_kg_m3": 1270,
                "velocity_km_s": 20,
                "spectral_class": "C",
                "description": "Hayabusa2 target asteroid"
            }
        ]
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# data/population.py
"""
Population data integration and exposure analysis
Uses population density data to estimate casualties within effect zones
"""

import numpy as np
import asyncio
import logging
from typing import List, Dict, Any, Tuple
from math import pi, cos, radians, sqrt
import json
import os
from models.responses import UncertaintyBand

logger = logging.getLogger(__name__)

class PopulationAnalyzer:
    """Analyze population exposure to asteroid impact effects"""
    
    def __init__(self):
        self.population_data = None
        self.is_loaded = False
        
        # Global population density estimates (people per km²)
        # Simplified grid-based approach for hackathon
        self.population_grid = {}
        
        # Major population centers for quick lookup
        self.major_cities = {
            "Tokyo": {"lat": 35.6762, "lon": 139.6503, "population": 37400068, "density": 6158},
            "Delhi": {"lat": 28.7041, "lon": 77.1025, "population": 30290936, "density": 11297},
            "Shanghai": {"lat": 31.2304, "lon": 121.4737, "population": 27058480, "density": 3847},
            "São Paulo": {"lat": -23.5558, "lon": -46.6396, "population": 22043028, "density": 7398},
            "Mexico City": {"lat": 19.4326, "lon": -99.1332, "population": 21671908, "density": 5967},
            "Cairo": {"lat": 30.0444, "lon": 31.2357, "population": 20484965, "density": 19376},
            "Mumbai": {"lat": 19.0760, "lon": 72.8777, "population": 20411274, "density": 20694},
            "Beijing": {"lat": 39.9042, "lon": 116.4074, "population": 20035455, "density": 1311},
            "Dhaka": {"lat": 23.8103, "lon": 90.4125, "population": 19578421, "density": 23234},
            "Osaka": {"lat": 34.6937, "lon": 135.5023, "population": 19222665, "density": 12004},
            "New York": {"lat": 40.7128, "lon": -74.0060, "population": 18804000, "density": 10194},
            "Karachi": {"lat": 24.8607, "lon": 67.0011, "population": 15400000, "density": 18900},
            "Istanbul": {"lat": 41.0082, "lon": 28.9784, "population": 15067724, "density": 2813},
            "Kinshasa": {"lat": -4.4419, "lon": 15.2663, "population": 14565000, "density": 1555},
            "Lagos": {"lat": 6.5244, "lon": 3.3792, "population": 14368332, "density": 13712},
            "Buenos Aires": {"lat": -34.6118, "lon": -58.3960, "population": 14967000, "density": 14429},
            "Kolkata": {"lat": 22.5726, "lon": 88.3639, "population": 14850066, "density": 24306},
            "Manila": {"lat": 14.5995, "lon": 120.9842, "population": 13482462, "density": 41515},
            "Tianjin": {"lat": 39.3434, "lon": 117.3616, "population": 13215344, "density": 1173},
            "Guangzhou": {"lat": 23.1291, "lon": 113.2644, "population": 13080500, "density": 1800},
        }
    
    async def load_population_data(self):
        """Load population density data"""
        logger.info("Loading population data...")
        
        try:
            # In a real implementation, this would load USGS/NASA population rasters
            # For the hackathon, we'll use the major cities data and interpolation
            await self._initialize_population_grid()
            self.is_loaded = True
            logger.info("Population data loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load population data: {e}")
            # Use simplified fallback
            self.is_loaded = True
    
    def is_ready(self) -> bool:
        """Check if population data is ready"""
        return self.is_loaded
    
    async def calculate_exposure(self, lat: float, lon: float, 
                               effect_zones: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate population exposure within impact effect zones
        
        Args:
            lat, lon: Impact location
            effect_zones: List of effect zones with radius samples
            
        Returns:
            Population exposure estimates with uncertainty
        """
        
        exposure_results = []
        total_affected_samples = []
        
        for zone in effect_zones:
            radius_samples = zone["radius_km_samples"]
            zone_type = zone["type"]
            threshold = zone["threshold"]
            description = zone["description"]
            
            # Calculate population within each radius sample
            population_samples = []
            
            for radius_km in radius_samples:
                if isinstance(radius_km, (list, np.ndarray)):
                    # If radius_km is an array, use median
                    radius_km = float(np.median(radius_km))
                
                # Calculate population within this radius
                population = await self._calculate_population_in_circle(lat, lon, radius_km)
                population_samples.append(population)
            
            population_samples = np.array(population_samples)
            total_affected_samples.extend(population_samples)
            
            # Format exposure result
            exposure_result = {
                "threshold": f"{zone_type}_{threshold}",
                "count": {
                    "p50": float(np.percentile(population_samples, 50)),
                    "range": [float(np.min(population_samples)), float(np.max(population_samples))],
                    "uncertainty_band": {
                        "p5": float(np.percentile(population_samples, 5)),
                        "p95": float(np.percentile(population_samples, 95))
                    }
                },
                "description": description,
                "zone_type": zone_type
            }
            
            exposure_results.append(exposure_result)
        
        # Calculate total affected population (maximum across all zones)
        if total_affected_samples:
            total_samples = np.array(total_affected_samples)
            max_affected = np.max(total_samples.reshape(-1, len(effect_zones)), axis=1)
            
            total_summary = {
                "p50": float(np.percentile(max_affected, 50)),
                "range": [float(np.min(max_affected)), float(np.max(max_affected))],
                "uncertainty_band": {
                    "p5": float(np.percentile(max_affected, 5)),
                    "p95": float(np.percentile(max_affected, 95))
                }
            }
        else:
            total_summary = {"p50": 0, "range": [0, 0], "uncertainty_band": {"p5": 0, "p95": 0}}
        
        return {
            "population": exposure_results,
            "total_affected": total_summary
        }
    
    async def _calculate_population_in_circle(self, center_lat: float, center_lon: float, 
                                            radius_km: float) -> int:
        """
        Calculate population within a circular area
        
        Uses simplified approach with major cities and interpolated density
        """
        if radius_km <= 0:
            return 0
        
        total_population = 0
        
        # Check each major city
        for city_name, city_data in self.major_cities.items():
            distance_km = self._calculate_distance(
                center_lat, center_lon, city_data["lat"], city_data["lon"]
            )
            
            if distance_km < radius_km:
                # City is within impact zone
                # Use population density to estimate affected population
                city_radius_km = sqrt(city_data["population"] / (pi * city_data["density"]))
                
                if distance_km + city_radius_km <= radius_km:
                    # Entire city affected
                    total_population += city_data["population"]
                else:
                    # Partial city affected - use geometric overlap
                    overlap_factor = self._calculate_circle_overlap(
                        distance_km, city_radius_km, radius_km
                    )
                    total_population += int(city_data["population"] * overlap_factor)
        
        # Add background rural population
        # Rough estimate: 50 people per km² average global density
        area_km2 = pi * radius_km**2
        rural_density = self._estimate_rural_density(center_lat, center_lon)
        rural_population = area_km2 * rural_density
        
        total_population += int(rural_population)
        
        return total_population
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate great circle distance between two points in km"""
        # Haversine formula
        R = 6371  # Earth radius in km
        
        lat1_rad, lon1_rad = radians(lat1), radians(lon1)
        lat2_rad, lon2_rad = radians(lat2), radians(lon2)
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = (np.sin(dlat/2)**2 + 
             np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon/2)**2)
        
        c = 2 * np.arcsin(np.sqrt(a))
        distance = R * c
        
        return distance
    
    def _calculate_circle_overlap(self, distance: float, radius1: float, radius2: float) -> float:
        """Calculate overlap factor between two circles"""
        if distance >= radius1 + radius2:
            return 0.0  # No overlap
        
        if distance <= abs(radius1 - radius2):
            return 1.0  # Complete overlap
        
        # Partial overlap - simplified approximation
        # This is a rough estimate for hackathon purposes
        overlap_distance = radius1 + radius2 - distance
        max_overlap = min(radius1, radius2) * 2
        
        return min(1.0, overlap_distance / max_overlap)
    
    def _estimate_rural_density(self, lat: float, lon: float) -> float:
        """Estimate rural population density based on location"""
        # Rough global population density estimates by region
        
        # Very sparse regions
        if (abs(lat) > 60 or  # Arctic/Antarctic
            (lat > 20 and lat < 35 and lon > -20 and lon < 60) or  # Sahara/Arabian deserts
            (lat > -30 and lat < -10 and lon > 110 and lon < 155) or  # Australian outback
            (lat > 15 and lat < 35 and lon > 70 and lon < 90)):  # Central Asian deserts
            return 1  # 1 person per km²
        
        # Moderately populated regions
        elif (abs(lat) > 45 or  # Northern regions
              (abs(lat) < 10 and abs(lon) > 60)):  # Tropical/remote areas
            return 20  # 20 people per km²
        
        # Well-populated regions
        elif (lat > 10 and lat < 70 and lon > -10 and lon < 60 or  # Europe/Western Asia
              lat > 20 and lat < 50 and lon > 70 and lon < 140 or  # East Asia
              lat > 25 and lat < 50 and lon > -130 and lon < -60):  # North America
            return 100  # 100 people per km²
        
        # Very dense regions
        elif (lat > 0 and lat < 40 and lon > 60 and lon < 100 or  # South Asia
              lat > -10 and lat < 20 and lon > 95 and lon < 140):  # Southeast Asia
            return 200  # 200 people per km²
        
        # Default moderate density
        return 50  # 50 people per km²
    
    async def _initialize_population_grid(self):
        """Initialize simplified population grid"""
        # For hackathon, we use the major cities data
        # In production, this would load actual USGS population raster data
        
        logger.info(f"Initialized population data with {len(self.major_cities)} major cities")
        
        # Could extend this to load actual raster data:
        # - USGS Global Population of the World (GPWv4)
        # - NASA SEDAC Gridded Population of the World
        # - WorldPop global population datasets
        
        return True