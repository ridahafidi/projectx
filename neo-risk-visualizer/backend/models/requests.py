"""Request models for API endpoints"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from enum import Enum

class DeflectionMethod(str, Enum):
    kinetic = "kinetic"
    tractor = "tractor"
    standoff = "standoff"

class SimulationRequest(BaseModel):
    """Request model for impact simulation"""
    lat: float = Field(..., ge=-90, le=90, description="Impact latitude in degrees")
    lon: float = Field(..., ge=-180, le=180, description="Impact longitude in degrees")
    diameter_m: float = Field(..., gt=0, le=10000, description="Asteroid diameter in meters")
    density_kg_m3: float = Field(2500, gt=0, le=10000, description="Asteroid density in kg/m³")
    velocity_km_s: float = Field(20, gt=0, le=100, description="Impact velocity in km/s")
    angle_deg: float = Field(45, ge=1, le=90, description="Impact angle in degrees from horizontal")
    
    @validator('diameter_m')
    def validate_diameter(cls, v):
        if v < 0.1:
            raise ValueError("Diameter must be at least 0.1 meters")
        if v > 10000:
            raise ValueError("Diameter cannot exceed 10 km for this simulation")
        return v
    
    @validator('velocity_km_s')
    def validate_velocity(cls, v):
        if v < 11:  # Minimum Earth impact velocity
            raise ValueError("Impact velocity must be at least 11 km/s (Earth escape velocity)")
        return v

class DeflectionRequest(BaseModel):
    """Request model for deflection simulation"""
    delta_v_cm_s: float = Field(..., gt=0, description="Delta-V in cm/s")
    lead_time_years: float = Field(..., gt=0, le=100, description="Lead time in years")
    method: DeflectionMethod = Field(..., description="Deflection method")
    asteroid_diameter_m: float = Field(100, gt=0, description="Asteroid diameter in meters")
    original_trajectory: Optional[Dict[str, Any]] = Field(None, description="Original trajectory data")
    
    @validator('delta_v_cm_s')
    def validate_delta_v(cls, v):
        if v > 10000:  # 100 m/s seems like a reasonable upper limit
            raise ValueError("Delta-V cannot exceed 10000 cm/s")
        return v