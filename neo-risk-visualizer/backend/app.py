"""
Impactor-2025 FastAPI Backend
NASA Space Apps Challenge - Asteroid Impact Simulation API
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from typing import List, Dict, Any
import os
from dotenv import load_dotenv

from models.requests import SimulationRequest, DeflectionRequest
from models.responses import SimulationResponse, DeflectionResponse, HealthResponse
from physics.impact_effects import ImpactEffectsCalculator
from physics.deflection import DeflectionCalculator
from data.nasa_api import NASADataProvider
from data.population import PopulationAnalyzer

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Impactor-2025 API",
    description="Interactive asteroid impact simulation and mitigation API for NASA Space Apps Challenge",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    """API Root endpoint with basic information"""
    return {
        "name": "Impactor-2025 API",
        "version": "1.0.0",
        "description": "Asteroid Impact Simulation & Planetary Defense API",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "simulate": "/simulate (POST)",
            "deflect": "/deflect (POST)",
            "asteroids": "/asteroids"
        },
        "status": "🚀 Ready for NASA Space Apps Challenge!"
    }

# Health check endpoint

# Initialize services
impact_calculator = ImpactEffectsCalculator()
deflection_calculator = DeflectionCalculator()
nasa_data = NASADataProvider(api_key=os.getenv("NASA_API_KEY"))
population_analyzer = PopulationAnalyzer()

@app.on_event("startup")
async def startup_event():
    """Initialize data sources on startup"""
    logger.info("Starting Impactor-2025 API...")
    await nasa_data.initialize_cache()
    await population_analyzer.load_population_data()
    logger.info("API ready for requests")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """System health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        services={
            "nasa_api": await nasa_data.check_connection(),
            "population_data": population_analyzer.is_ready(),
            "physics_engine": True
        }
    )

@app.get("/asteroids")
async def get_asteroids(limit: int = 50, min_diameter: float = 10.0):
    """Fetch asteroid catalog from NASA CNEOS/SBDB"""
    try:
        asteroids = await nasa_data.get_potentially_hazardous_asteroids(
            limit=limit, min_diameter_m=min_diameter
        )
        return {"asteroids": asteroids, "count": len(asteroids)}
    except Exception as e:
        logger.error(f"Failed to fetch asteroids: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch asteroid data")

@app.post("/simulate", response_model=SimulationResponse)
async def simulate_impact(request: SimulationRequest):
    """
    Simulate asteroid impact effects and population exposure
    
    This endpoint calculates:
    - Blast effects (overpressure zones)
    - Thermal effects (heat flux zones) 
    - Crater formation
    - Population exposure estimates with uncertainty
    """
    try:
        logger.info(f"Simulating impact at ({request.lat}, {request.lon})")
        
        # Calculate impact effects with Monte Carlo uncertainty
        effects = impact_calculator.calculate_effects(
            diameter_m=request.diameter_m,
            density_kg_m3=request.density_kg_m3,
            velocity_km_s=request.velocity_km_s,
            angle_deg=request.angle_deg,
            target_lat=request.lat,
            target_lon=request.lon
        )
        
        # Convert effects to zones format for population analysis
        zones = []
        if "blast" in effects:
            for effect in effects["blast"]:
                zones.append({
                    "type": "blast",
                    "threshold": effect.psi,
                    "radius_km_samples": effect.r_km.p50
                })
        if "thermal" in effects:
            for effect in effects["thermal"]:
                zones.append({
                    "type": "thermal", 
                    "threshold": effect.J_m2,
                    "radius_km_samples": effect.r_km.p50
                })
        if "texture" in effects:
            for effect in effects["texture"]:
                zones.append({
                    "type": "texture",
                    "material": effect.material_type,
                    "threshold": effect.damage_threshold,
                    "radius_km_samples": effect.r_km.p50
                })
        
        # Calculate population exposure within effect zones
        exposure = await population_analyzer.calculate_exposure(
            lat=request.lat,
            lon=request.lon,
            effect_zones=zones
        )
        
        response = SimulationResponse(
            effects=effects,
            exposure=exposure,
            metadata={
                "calculation_time_ms": effects.get("calc_time_ms", 0),
                "uncertainty_method": "monte_carlo",
                "population_year": 2025
            }
        )
        
        logger.info(f"Simulation completed in {effects.get('calc_time_ms', 0)}ms")
        return response
        
    except ValueError as e:
        logger.error(f"Invalid simulation parameters: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        raise HTTPException(status_code=500, detail="Simulation calculation failed")

@app.post("/deflect", response_model=DeflectionResponse)
async def simulate_deflection(request: DeflectionRequest):
    """
    Simulate asteroid deflection scenarios
    
    Calculates how deflection missions change impact probability
    and shift the impact corridor on Earth's surface.
    """
    try:
        logger.info(f"Simulating {request.method} deflection: {request.delta_v_cm_s} cm/s, {request.lead_time_years} years lead time")
        
        # Calculate deflection effects
        deflection_results = deflection_calculator.calculate_deflection(
            delta_v_cm_s=request.delta_v_cm_s,
            lead_time_years=request.lead_time_years,
            method=request.method,
            asteroid_diameter_m=request.asteroid_diameter_m,
            original_trajectory=request.original_trajectory
        )
        
        response = DeflectionResponse(**deflection_results)
        
        logger.info(f"Deflection simulation completed: {response.classification}")
        return response
        
    except ValueError as e:
        logger.error(f"Invalid deflection parameters: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Deflection simulation failed: {e}")
        raise HTTPException(status_code=500, detail="Deflection calculation failed")

@app.get("/scenarios/presets")
async def get_preset_scenarios():
    """Get predefined impact scenarios for quick testing"""
    presets = [
        {
            "name": "Tunguska-class Event",
            "description": "Similar to 1908 Tunguska explosion",
            "diameter_m": 60,
            "density_kg_m3": 2000,
            "velocity_km_s": 20,
            "angle_deg": 45,
            "example_location": {"lat": 60.9, "lon": 101.9}
        },
        {
            "name": "Chelyabinsk-class Event", 
            "description": "Similar to 2013 Chelyabinsk meteor",
            "diameter_m": 20,
            "density_kg_m3": 3700,
            "velocity_km_s": 19,
            "angle_deg": 20,
            "example_location": {"lat": 55.1, "lon": 61.4}
        },
        {
            "name": "City-Killer Scenario",
            "description": "140m asteroid - regional devastation",
            "diameter_m": 140,
            "density_kg_m3": 2500,
            "velocity_km_s": 25,
            "angle_deg": 30,
            "example_location": {"lat": 40.7, "lon": -74.0}  # NYC
        },
        {
            "name": "Civilization Threat",
            "description": "1km asteroid - global consequences",
            "diameter_m": 1000,
            "density_kg_m3": 2200,
            "velocity_km_s": 20,
            "angle_deg": 45,
            "example_location": {"lat": 0, "lon": 0}  # Equatorial impact
        }
    ]
    return {"presets": presets}

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint not found"}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error - check logs for details"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )