# models/__init__.py
# Empty init file

# models/requests.py
"""Request models for API endpoints"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
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

# models/responses.py
"""Response models for API endpoints"""

from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from enum import Enum

class ImpactClassification(str, Enum):
    hit = "hit"
    miss = "miss" 
    clear = "clear"

class UncertaintyBand(BaseModel):
    """Uncertainty representation with percentiles"""
    p5: float = Field(..., description="5th percentile")
    p50: float = Field(..., description="50th percentile (median)")
    p95: float = Field(..., description="95th percentile")

class BlastEffect(BaseModel):
    """Blast overpressure effect zone"""
    psi: float = Field(..., description="Overpressure in PSI")
    r_km: UncertaintyBand = Field(..., description="Radius in km with uncertainty")
    description: str = Field(..., description="Human-readable effect description")

class ThermalEffect(BaseModel):
    """Thermal radiation effect zone"""
    J_m2: float = Field(..., description="Heat flux in J/m²")
    r_km: UncertaintyBand = Field(..., description="Radius in km with uncertainty")
    description: str = Field(..., description="Human-readable effect description")

class CraterEffect(BaseModel):
    """Crater formation parameters"""
    rim_r_km: UncertaintyBand = Field(..., description="Rim radius in km with uncertainty")
    depth_m: UncertaintyBand = Field(..., description="Crater depth in meters with uncertainty")
    ejecta_r_km: UncertaintyBand = Field(..., description="Ejecta blanket radius in km")

class PopulationExposure(BaseModel):
    """Population exposure estimate"""
    threshold: str = Field(..., description="Effect threshold (e.g., 'psi>=5')")
    count: Dict[str, Any] = Field(..., description="Population count with uncertainty")

class EffectsData(BaseModel):
    """Complete impact effects data"""
    blast: List[BlastEffect] = Field(..., description="Blast effect zones")
    thermal: List[ThermalEffect] = Field(..., description="Thermal effect zones")
    crater: CraterEffect = Field(..., description="Crater parameters")

class ExposureData(BaseModel):
    """Population exposure data"""
    population: List[PopulationExposure] = Field(..., description="Population exposure by effect")
    total_affected: Dict[str, Any] = Field(..., description="Total population summary")

class SimulationResponse(BaseModel):
    """Complete simulation response"""
    effects: EffectsData = Field(..., description="Physical impact effects")
    exposure: ExposureData = Field(..., description="Population exposure estimates")
    metadata: Dict[str, Any] = Field(..., description="Calculation metadata")

class DeflectionResponse(BaseModel):
    """Deflection simulation response"""
    corridor_shift_km: float = Field(..., description="Impact corridor shift in km")
    impact_probability_drop: float = Field(..., description="Probability reduction (0-1)")
    classification: ImpactClassification = Field(..., description="Final impact classification")
    new_trajectory: Dict[str, Any] = Field(..., description="Updated trajectory parameters")
    mission_feasibility: Dict[str, Any] = Field(..., description="Mission feasibility assessment")

class HealthResponse(BaseModel):
    """System health check response"""
    status: str = Field(..., description="Overall system status")
    version: str = Field(..., description="API version")
    services: Dict[str, bool] = Field(..., description="Service status checks")