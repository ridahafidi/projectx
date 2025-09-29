"""Simplified impact effects calculator for demo"""

import time
from typing import Dict, Any, List
from math import sqrt, pi
from models.responses import UncertaintyBand, BlastEffect, ThermalEffect, CraterEffect, TextureEffect

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
        
        # Material damage thresholds (pressure in PSI and thermal flux in J/m²)
        self.TEXTURE_THRESHOLDS = [
            # Format: (material, pressure_psi, thermal_flux_J_m2, damage_description, consequences)
            ("glass", 0.1, 50000, "Window shattering and glass damage", "Flying glass fragments causing severe lacerations, eye injuries, and puncture wounds"),
            ("wood", 0.5, 125000, "Wooden structure damage", "Splinter injuries, structural collapse causing crushing and blunt force trauma"),
            ("concrete", 2.0, 200000, "Concrete cracking and spalling", "Debris projectiles causing head trauma, abrasions, and crush injuries"),
            ("steel", 5.0, 300000, "Steel structure deformation", "Structural failure leading to crushing injuries and internal trauma"),
            ("brick", 1.5, 150000, "Brick wall collapse", "Falling masonry causing blunt force trauma, fractures, and crushing injuries"),
            ("asphalt", 1.0, 100000, "Road surface damage", "Debris and uneven surfaces causing falls, cuts, and vehicle accidents"),
            ("vegetation", 0.2, 80000, "Tree damage and flying debris", "Projectile injuries from branches, leaves causing respiratory irritation"),
            ("fabric", 0.05, 30000, "Clothing and textile damage", "Thermal burns, exposure-related injuries, loss of protective barriers")
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
        
        # Calculate texture/material damage effects
        texture_effects = []
        for material, pressure_threshold, thermal_threshold, description, consequences in self.TEXTURE_THRESHOLDS:
            # Calculate damage radius based on blast pressure
            if pressure_threshold == 0.1:
                k_factor = 200  # Very sensitive materials like glass
            elif pressure_threshold <= 0.5:
                k_factor = 120
            elif pressure_threshold <= 1.0:
                k_factor = 85
            elif pressure_threshold <= 2.0:
                k_factor = 55
            else:
                k_factor = 35
            
            # Blast damage radius
            blast_radius_m = k_factor * (tnt_tons ** (1/3))
            
            # Thermal damage radius (30% of energy becomes thermal radiation)
            thermal_energy = 0.3 * energy_j
            thermal_radius_m = sqrt(thermal_energy / (4 * pi * thermal_threshold))
            thermal_radius_m = min(thermal_radius_m, 500000)  # Cap at 500 km
            
            # Take the maximum of blast and thermal effects for each material
            combined_radius_m = max(blast_radius_m, thermal_radius_m)
            final_radius_km = combined_radius_m / 1000
            
            # Calculate damage percentage based on distance from impact
            # Materials closer to impact have higher damage rates
            base_damage = min(100, 100 * (1 / (1 + final_radius_km * 0.1))) if final_radius_km > 0 else 0
            
            texture_effects.append(TextureEffect(
                material_type=material,
                damage_threshold=pressure_threshold,
                damage_percentage=UncertaintyBand(
                    p5=base_damage * 0.7,
                    p50=base_damage,
                    p95=min(100, base_damage * 1.3)
                ),
                r_km=UncertaintyBand(
                    p5=final_radius_km * 0.8,
                    p50=final_radius_km,
                    p95=final_radius_km * 1.2
                ),
                description=description,
                consequences=consequences
            ))
        
        return {
            "blast": blast_effects,
            "thermal": thermal_effects,
            "crater": crater,
            "texture": texture_effects,
            "calc_time_ms": int((time.time() - start_time) * 1000),
            "energy_tnt_tons": tnt_tons
        }