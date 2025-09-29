"""Simplified impact effects calculator for demo"""

import time
from typing import Dict, Any, List
from math import sqrt, pi
from models.responses import UncertaintyBand, BlastEffect, ThermalEffect, CraterEffect

class ImpactEffectsCalculator:
    """Simple impact effects calculator without numpy dependency for quick demo"""
    
    def __init__(self):
        self.BLAST_THRESHOLDS = [
            (1, "Window breakage, minor injuries"),
            (5, "Building damage, serious injuries"), 
            (10, "Residential building collapse"),
            (20, "Reinforced structures damaged"),
            (50, "Total destruction")
        ]
        
        self.THERMAL_THRESHOLDS = [
            (125000, "1st degree burns"),
            (250000, "2nd degree burns"),
            (500000, "3rd degree burns"),
            (1000000, "Ignition of clothing"),
            (2000000, "Ignition of dry vegetation")
        ]
    
    def calculate_effects(self, diameter_m: float, density_kg_m3: float, 
                         velocity_km_s: float, angle_deg: float,
                         target_lat: float, target_lon: float) -> Dict[str, Any]:
        """Calculate simplified impact effects"""
        start_time = time.time()
        
        # Simple energy calculation
        volume = (4/3) * pi * (diameter_m/2)**3
        mass_kg = volume * density_kg_m3
        velocity_ms = velocity_km_s * 1000
        energy_j = 0.5 * mass_kg * velocity_ms**2
        
        # Convert to TNT equivalent
        tnt_tons = energy_j / 4.184e9
        
        # Simple blast radius calculation
        blast_effects = []
        for psi, desc in self.BLAST_THRESHOLDS:
            if psi == 1:
                k = 160
            elif psi == 5:
                k = 65
            elif psi == 10:
                k = 45
            elif psi == 20:
                k = 30
            else:
                k = 20
            
            radius_m = k * (tnt_tons ** (1/3))
            radius_km = radius_m / 1000
            
            blast_effects.append(BlastEffect(
                psi=psi,
                r_km=UncertaintyBand(
                    p5=radius_km * 0.8,
                    p50=radius_km,
                    p95=radius_km * 1.2
                ),
                description=desc
            ))
        
        # Simple thermal effects
        thermal_effects = []
        for flux, desc in self.THERMAL_THRESHOLDS:
            thermal_energy = 0.3 * energy_j
            radius_m = sqrt(thermal_energy / (4 * pi * flux))
            radius_km = min(radius_m / 1000, 1000)
            
            thermal_effects.append(ThermalEffect(
                J_m2=flux,
                r_km=UncertaintyBand(
                    p5=radius_km * 0.7,
                    p50=radius_km,
                    p95=radius_km * 1.3
                ),
                description=desc
            ))
        
        # Simple crater
        crater_diameter_m = 1.8 * (energy_j / (2700 * 9.81))**0.25
        crater = CraterEffect(
            rim_r_km=UncertaintyBand(
                p5=(crater_diameter_m / 2000) * 0.8,
                p50=crater_diameter_m / 2000,
                p95=(crater_diameter_m / 2000) * 1.2
            ),
            depth_m=UncertaintyBand(
                p5=(crater_diameter_m * 0.2) * 0.8,
                p50=crater_diameter_m * 0.2,
                p95=(crater_diameter_m * 0.2) * 1.2
            ),
            ejecta_r_km=UncertaintyBand(
                p5=(crater_diameter_m * 1.5 / 1000) * 0.8,
                p50=crater_diameter_m * 1.5 / 1000,
                p95=(crater_diameter_m * 1.5 / 1000) * 1.2
            )
        )
        
        return {
            "blast": blast_effects,
            "thermal": thermal_effects,
            "crater": crater,
            "calc_time_ms": int((time.time() - start_time) * 1000),
            "energy_tnt_tons": tnt_tons
        }