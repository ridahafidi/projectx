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

class TextureEffect(BaseModel):
    """Material/texture damage effect zone"""
    material_type: str = Field(..., description="Material type (concrete, steel, wood, glass, etc.)")
    damage_threshold: float = Field(..., description="Damage threshold (pressure, temperature, or energy)")
    damage_percentage: UncertaintyBand = Field(..., description="Damage percentage with uncertainty")
    r_km: UncertaintyBand = Field(..., description="Radius in km with uncertainty")
    description: str = Field(..., description="Human-readable damage description")
    consequences: str = Field(..., description="Physical consequences and flesh effects")

class PopulationExposure(BaseModel):
    """Population exposure estimate"""
    threshold: str = Field(..., description="Effect threshold (e.g., 'psi>=5')")
    count: Dict[str, Any] = Field(..., description="Population count with uncertainty")

class EffectsData(BaseModel):
    """Complete impact effects data"""
    blast: List[BlastEffect] = Field(..., description="Blast effect zones")
    thermal: List[ThermalEffect] = Field(..., description="Thermal effect zones")
    crater: CraterEffect = Field(..., description="Crater parameters")
    texture: List[TextureEffect] = Field(..., description="Material/texture damage zones")

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