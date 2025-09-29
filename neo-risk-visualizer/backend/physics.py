# physics/__init__.py
# Empty init file

# physics/impact_effects.py
"""
Asteroid impact effects calculator based on Earth Impact Effects Program
Simplified physics for rapid prototyping - NASA Space Apps Challenge
"""

import numpy as np
import time
from typing import Dict, Any, List
from math import sqrt, log, pi, sin, cos, radians
from models.responses import UncertaintyBand, BlastEffect, ThermalEffect, CraterEffect, TextureEffect
from .monte_carlo import MonteCarloSimulator

class ImpactEffectsCalculator:
    """Calculate asteroid impact effects with uncertainty quantification"""
    
    def __init__(self):
        self.mc_simulator = MonteCarloSimulator()
        
        # Physical constants
        self.EARTH_GRAVITY = 9.81  # m/s²
        self.AIR_DENSITY = 1.225   # kg/m³ at sea level
        self.EARTH_RADIUS = 6371000  # meters
        
        # Effect thresholds and descriptions
        self.BLAST_THRESHOLDS = [
            (1, "Window breakage, minor injuries"),
            (5, "Building damage, serious injuries"), 
            (10, "Residential building collapse"),
            (20, "Reinforced structures damaged"),
            (50, "Total destruction")
        ]
        
        self.THERMAL_THRESHOLDS = [
            (125000, "1st degree burns"),    # 125 kJ/m²
            (250000, "2nd degree burns"),    # 250 kJ/m²
            (500000, "3rd degree burns"),    # 500 kJ/m²
            (1000000, "Ignition of clothing"), # 1 MJ/m²
            (2000000, "Ignition of dry vegetation") # 2 MJ/m²
        ]
        
        # Material damage thresholds (pressure in PSI and temperature effects)
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
        """
        Calculate impact effects using Monte Carlo uncertainty propagation
        
        Based on simplified Earth Impact Effects Program equations:
        - Collins, Melosh & Marcus (2005) - Earth Impact Effects Program
        - Simplified for hackathon timeline
        """
        start_time = time.time()
        
        # Convert units
        velocity_ms = velocity_km_s * 1000  # m/s
        angle_rad = radians(angle_deg)
        
        # Monte Carlo parameters with uncertainty
        n_samples = 1000
        
        # Add parameter uncertainties (typical for asteroid observations)
        diameter_samples = self.mc_simulator.add_uncertainty(diameter_m, 0.1)  # 10% uncertainty
        density_samples = self.mc_simulator.add_uncertainty(density_kg_m3, 0.2)  # 20% uncertainty
        velocity_samples = self.mc_simulator.add_uncertainty(velocity_ms, 0.05)  # 5% uncertainty
        angle_samples = self.mc_simulator.add_uncertainty(angle_rad, 0.1)  # angle uncertainty
        
        # Calculate impact energy for all samples
        masses = (4/3) * pi * (diameter_samples/2)**3 * density_samples
        kinetic_energies = 0.5 * masses * velocity_samples**2  # Joules
        
        # Atmospheric filtering (simplified)
        # Smaller asteroids lose more energy in atmosphere
        atmospheric_efficiency = np.clip(1 - np.exp(-diameter_samples/20), 0.1, 1.0)
        ground_energies = kinetic_energies * atmospheric_efficiency
        
        # Convert to TNT equivalent (1 ton TNT = 4.184e9 J)
        tnt_equivalent_tons = ground_energies / 4.184e9
        
        # Calculate blast effects
        blast_effects = self._calculate_blast_effects(tnt_equivalent_tons, angle_samples)
        
        # Calculate thermal effects  
        thermal_effects = self._calculate_thermal_effects(ground_energies, diameter_samples)
        
        # Calculate crater effects
        crater_effects = self._calculate_crater_effects(
            ground_energies, velocity_samples, angle_samples, density_samples
        )
        
        # Calculate texture/material damage effects
        texture_effects = self._calculate_texture_damage(tnt_equivalent_tons, ground_energies, angle_samples)
        
        # Package results with uncertainty bands
        effects_data = {
            "zones": self._package_effect_zones(blast_effects, thermal_effects, crater_effects, texture_effects),
            "blast": self._format_blast_effects(blast_effects),
            "thermal": self._format_thermal_effects(thermal_effects),
            "crater": self._format_crater_effects(crater_effects),
            "texture": self._format_texture_effects(texture_effects),
            "calc_time_ms": int((time.time() - start_time) * 1000),
            "energy_tnt_tons": {
                "p5": float(np.percentile(tnt_equivalent_tons, 5)),
                "p50": float(np.percentile(tnt_equivalent_tons, 50)),
                "p95": float(np.percentile(tnt_equivalent_tons, 95))
            }
        }
        
        return effects_data
    
    def _calculate_blast_effects(self, tnt_tons: np.ndarray, angles: np.ndarray) -> Dict[str, np.ndarray]:
        """Calculate blast overpressure effects"""
        results = {}
        
        for psi_threshold, description in self.BLAST_THRESHOLDS:
            # Simplified blast radius calculation
            # R = K * (TNT_tons)^(1/3) where K depends on overpressure
            # Scaling factors roughly based on Glasstone & Dolan (1977)
            if psi_threshold == 1:
                k_factor = 160  # meters per ton^(1/3)
            elif psi_threshold == 5:
                k_factor = 65
            elif psi_threshold == 10:
                k_factor = 45
            elif psi_threshold == 20:
                k_factor = 30
            else:  # 50 PSI
                k_factor = 20
            
            # Calculate radius in meters, then convert to km
            radius_m = k_factor * (tnt_tons ** (1/3))
            
            # Apply angle correction (grazing impacts create elliptical damage)
            angle_factor = (np.sin(angles) + 0.3)  # Minimum 30% efficiency for grazing
            radius_km = (radius_m * angle_factor) / 1000
            
            results[f"psi_{psi_threshold}"] = {
                "radius_km": radius_km,
                "psi": psi_threshold,
                "description": description
            }
        
        return results
    
    def _calculate_thermal_effects(self, energies: np.ndarray, diameters: np.ndarray) -> Dict[str, np.ndarray]:
        """Calculate thermal radiation effects"""
        results = {}
        
        # Fireball radius (simplified)
        fireball_radius_m = 0.5 * diameters * (energies / (4.184e9))**(1/3)  # Rough approximation
        
        for flux_threshold, description in self.THERMAL_THRESHOLDS:
            # Thermal flux decreases as 1/r² from fireball
            # Simplified: assume 30% of kinetic energy becomes thermal radiation
            thermal_energy = 0.3 * energies
            
            # Distance at which flux drops to threshold
            # Flux = Energy / (4π * r²)
            radius_m = np.sqrt(thermal_energy / (4 * pi * flux_threshold))
            radius_km = radius_m / 1000
            
            # Thermal effects blocked by terrain/atmosphere for very long ranges
            radius_km = np.minimum(radius_km, 1000)  # Cap at 1000 km
            
            results[f"thermal_{flux_threshold}"] = {
                "radius_km": radius_km,
                "flux_J_m2": flux_threshold,
                "description": description
            }
        
        return results
    
    def _calculate_crater_effects(self, energies: np.ndarray, velocities: np.ndarray, 
                                  angles: np.ndarray, densities: np.ndarray) -> Dict[str, np.ndarray]:
        """Calculate crater formation parameters"""
        
        # Crater scaling laws (simplified from Melosh 1989)
        # Final crater diameter depends on energy, target properties, gravity
        
        # Target rock density (assumed typical crustal rock)
        target_density = 2700  # kg/m³
        
        # Crater diameter scaling
        # D_crater = K * (Energy / (ρ_target * g))^0.25
        crater_scale_factor = 1.8  # Empirical constant
        
        gravity_term = target_density * self.EARTH_GRAVITY
        crater_diameter_m = crater_scale_factor * (energies / gravity_term)**0.25
        
        # Angle correction for oblique impacts
        angle_efficiency = np.sin(angles)**0.5  # Oblique impacts create smaller craters
        crater_diameter_m *= angle_efficiency
        
        # Crater depth typically 1/5 to 1/10 of diameter
        crater_depth_m = crater_diameter_m * 0.2
        
        # Ejecta blanket extends ~2-3 crater radii
        ejecta_radius_m = crater_diameter_m * 1.5
        
        return {
            "rim_radius_m": crater_diameter_m / 2,
            "depth_m": crater_depth_m,
            "ejecta_radius_m": ejecta_radius_m
        }
    
    def _calculate_texture_damage(self, tnt_tons: np.ndarray, energies: np.ndarray, angles: np.ndarray) -> Dict[str, Dict]:
        """Calculate material/texture damage effects based on pressure and thermal flux"""
        results = {}
        
        for material, pressure_threshold, thermal_threshold, description, consequences in self.TEXTURE_THRESHOLDS:
            # Calculate damage radius based on blast pressure (similar to blast effects)
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
            thermal_energy = 0.3 * energies
            thermal_radius_m = np.sqrt(thermal_energy / (4 * pi * thermal_threshold))
            thermal_radius_m = np.minimum(thermal_radius_m, 500000)  # Cap at 500 km
            
            # Take the maximum of blast and thermal effects for each material
            combined_radius_m = np.maximum(blast_radius_m, thermal_radius_m)
            
            # Apply angle correction
            angle_factor = (np.sin(angles) + 0.2)  # Materials get damaged even in grazing impacts
            final_radius_km = (combined_radius_m * angle_factor) / 1000
            
            # Calculate damage percentage based on distance from impact
            # Materials closer to impact have higher damage rates
            base_damage = np.where(
                final_radius_km > 0,
                np.minimum(100, 100 * (1 / (1 + final_radius_km * 0.1))),  # Decreases with distance
                0
            )
            
            results[f"texture_{material}"] = {
                "material_type": material,
                "radius_km": final_radius_km,
                "damage_threshold": pressure_threshold,
                "damage_percentage": base_damage,
                "description": description,
                "consequences": consequences
            }
        
        return results
    
    def _package_effect_zones(self, blast: Dict, thermal: Dict, crater: Dict, texture: Dict) -> List[Dict[str, Any]]:
        """Package effect zones for population analysis"""
        zones = []
        
        # Add blast zones
        for key, data in blast.items():
            zones.append({
                "type": "blast",
                "threshold": data["psi"],
                "radius_km_samples": data["radius_km"],
                "description": data["description"]
            })
        
        # Add thermal zones  
        for key, data in thermal.items():
            zones.append({
                "type": "thermal",
                "threshold": data["flux_J_m2"],
                "radius_km_samples": data["radius_km"],
                "description": data["description"]
            })
        
        # Add texture damage zones
        for key, data in texture.items():
            zones.append({
                "type": "texture",
                "material": data["material_type"],
                "threshold": data["damage_threshold"],
                "radius_km_samples": data["radius_km"],
                "description": data["description"],
                "consequences": data["consequences"]
            })
        
        # Add crater zone
        zones.append({
            "type": "crater",
            "threshold": "total_destruction",
            "radius_km_samples": crater["rim_radius_m"] / 1000,
            "description": "Complete crater formation"
        })
        
        return zones
    
    def _format_blast_effects(self, blast_data: Dict) -> List[BlastEffect]:
        """Format blast effects for API response"""
        effects = []
        for key, data in blast_data.items():
            radius_samples = data["radius_km"]
            effects.append(BlastEffect(
                psi=data["psi"],
                r_km=UncertaintyBand(
                    p5=float(np.percentile(radius_samples, 5)),
                    p50=float(np.percentile(radius_samples, 50)),
                    p95=float(np.percentile(radius_samples, 95))
                ),
                description=data["description"]
            ))
        return effects
    
    def _format_thermal_effects(self, thermal_data: Dict) -> List[ThermalEffect]:
        """Format thermal effects for API response"""
        effects = []
        for key, data in thermal_data.items():
            radius_samples = data["radius_km"]
            effects.append(ThermalEffect(
                J_m2=data["flux_J_m2"],
                r_km=UncertaintyBand(
                    p5=float(np.percentile(radius_samples, 5)),
                    p50=float(np.percentile(radius_samples, 50)),
                    p95=float(np.percentile(radius_samples, 95))
                ),
                description=data["description"]
            ))
        return effects
    
    def _format_crater_effects(self, crater_data: Dict) -> CraterEffect:
        """Format crater effects for API response"""
        rim_samples = crater_data["rim_radius_m"] / 1000  # Convert to km
        depth_samples = crater_data["depth_m"]
        ejecta_samples = crater_data["ejecta_radius_m"] / 1000  # Convert to km
        
        return CraterEffect(
            rim_r_km=UncertaintyBand(
                p5=float(np.percentile(rim_samples, 5)),
                p50=float(np.percentile(rim_samples, 50)),
                p95=float(np.percentile(rim_samples, 95))
            ),
            depth_m=UncertaintyBand(
                p5=float(np.percentile(depth_samples, 5)),
                p50=float(np.percentile(depth_samples, 50)),
                p95=float(np.percentile(depth_samples, 95))
            ),
            ejecta_r_km=UncertaintyBand(
                p5=float(np.percentile(ejecta_samples, 5)),
                p50=float(np.percentile(ejecta_samples, 50)),
                p95=float(np.percentile(ejecta_samples, 95))
            )
        )
    
    def _format_texture_effects(self, texture_data: Dict) -> List[TextureEffect]:
        """Format texture/material damage effects for API response"""
        effects = []
        for key, data in texture_data.items():
            radius_samples = data["radius_km"]
            damage_samples = data["damage_percentage"]
            effects.append(TextureEffect(
                material_type=data["material_type"],
                damage_threshold=data["damage_threshold"],
                damage_percentage=UncertaintyBand(
                    p5=float(np.percentile(damage_samples, 5)),
                    p50=float(np.percentile(damage_samples, 50)),
                    p95=float(np.percentile(damage_samples, 95))
                ),
                r_km=UncertaintyBand(
                    p5=float(np.percentile(radius_samples, 5)),
                    p50=float(np.percentile(radius_samples, 50)),
                    p95=float(np.percentile(radius_samples, 95))
                ),
                description=data["description"],
                consequences=data["consequences"]
            ))
        return effects


# physics/monte_carlo.py
"""Monte Carlo uncertainty propagation for impact simulations"""

import numpy as np
from typing import List, Dict, Any

class MonteCarloSimulator:
    """Handle uncertainty propagation through Monte Carlo sampling"""
    
    def __init__(self, n_samples: int = 1000):
        self.n_samples = n_samples
        np.random.seed(42)  # Reproducible results for demo
    
    def add_uncertainty(self, mean_value: float, relative_uncertainty: float) -> np.ndarray:
        """
        Add uncertainty to a parameter using log-normal distribution
        
        Args:
            mean_value: Central value
            relative_uncertainty: Fractional uncertainty (e.g., 0.1 = 10%)
        
        Returns:
            Array of samples with uncertainty
        """
        if relative_uncertainty <= 0:
            return np.full(self.n_samples, mean_value)
        
        # Log-normal distribution preserves positive values and is realistic for physical parameters
        sigma = np.log(1 + relative_uncertainty)
        mu = np.log(mean_value) - 0.5 * sigma**2
        
        samples = np.random.lognormal(mu, sigma, self.n_samples)
        return samples
    
    def correlate_parameters(self, param1: np.ndarray, param2: np.ndarray, 
                            correlation: float = 0.0) -> tuple:
        """
        Add correlation between two parameter arrays
        
        Args:
            param1, param2: Parameter sample arrays
            correlation: Correlation coefficient (-1 to 1)
        
        Returns:
            Tuple of correlated parameter arrays
        """
        if abs(correlation) < 0.01:
            return param1, param2
        
        # Use Cholesky decomposition for correlation
        mean1, mean2 = np.mean(param1), np.mean(param2)
        std1, std2 = np.std(param1), np.std(param2)
        
        # Standardize
        z1 = (param1 - mean1) / std1
        z2 = (param2 - mean2) / std2
        
        # Apply correlation
        z2_corr = correlation * z1 + np.sqrt(1 - correlation**2) * z2
        
        # Transform back
        param2_corr = z2_corr * std2 + mean2
        
        return param1, param2_corr


# physics/deflection.py
"""
Asteroid deflection physics calculator
Simplified models for kinetic impactor, gravity tractor, and nuclear standoff
"""

import numpy as np
from typing import Dict, Any
from math import pi, sqrt
from models.responses import ImpactClassification

class DeflectionCalculator:
    """Calculate asteroid deflection mission effectiveness"""
    
    def __init__(self):
        # Physical constants
        self.AU = 1.496e11  # Astronomical unit in meters
        self.EARTH_RADIUS = 6371000  # meters
        
        # Mission parameters by method
        self.METHOD_EFFICIENCY = {
            "kinetic": 0.2,      # Momentum transfer efficiency  
            "tractor": 1.0,      # Perfect efficiency for gravity tractor
            "standoff": 0.8      # Nuclear standoff efficiency
        }
    
    def calculate_deflection(self, delta_v_cm_s: float, lead_time_years: float,
                           method: str, asteroid_diameter_m: float = 100,
                           original_trajectory: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Calculate deflection mission results
        
        Simplified physics:
        - Linear trajectory propagation
        - Keyhole avoidance probability
        - Impact corridor shift calculation
        """
        
        # Convert delta-V to m/s
        delta_v_ms = delta_v_cm_s / 100
        
        # Apply method efficiency
        effective_delta_v = delta_v_ms * self.METHOD_EFFICIENCY.get(method, 0.5)
        
        # Calculate position change at Earth encounter
        # Simple linear propagation: Δr = Δv * t
        lead_time_seconds = lead_time_years * 365.25 * 24 * 3600
        
        # For asteroids, typical encounter geometry amplifies small deflections
        # Geometric amplification factor (simplified)
        if lead_time_years > 10:
            amplification = lead_time_years * 100  # Long lead times are much more effective
        else:
            amplification = lead_time_years * 20   # Short lead times still help
        
        # Position change at Earth (meters)
        position_change_m = effective_delta_v * amplification
        corridor_shift_km = position_change_m / 1000
        
        # Estimate impact probability change
        # Based on how much we shift relative to Earth's cross-section
        earth_cross_section = pi * (self.EARTH_RADIUS + 100000)**2  # Include atmosphere
        
        # Probability reduction depends on deflection relative to Earth size
        if corridor_shift_km > 20000:  # Shifted more than Earth diameter
            probability_drop = 0.99  # Almost certain miss
            classification = ImpactClassification.clear
        elif corridor_shift_km > 1000:  # Significant shift
            probability_drop = min(0.95, corridor_shift_km / 15000)
            classification = ImpactClassification.miss
        elif corridor_shift_km > 100:  # Moderate shift
            probability_drop = corridor_shift_km / 5000
            classification = ImpactClassification.miss
        else:  # Small shift
            probability_drop = corridor_shift_km / 10000
            classification = ImpactClassification.hit
        
        # Mission feasibility assessment
        feasibility = self._assess_mission_feasibility(
            method, delta_v_cm_s, lead_time_years, asteroid_diameter_m
        )
        
        # New trajectory (simplified - just show the deflection)
        new_trajectory = {
            "deflection_m_s": effective_delta_v,
            "position_change_km": corridor_shift_km,
            "lead_time_years": lead_time_years,
            "method": method
        }
        
        return {
            "corridor_shift_km": corridor_shift_km,
            "impact_probability_drop": probability_drop,
            "classification": classification,
            "new_trajectory": new_trajectory,
            "mission_feasibility": feasibility
        }
    
    def _assess_mission_feasibility(self, method: str, delta_v_cm_s: float,
                                   lead_time_years: float, diameter_m: float) -> Dict[str, Any]:
        """Assess mission feasibility based on current technology"""
        
        # Rough feasibility assessment
        feasibility = {
            "overall_score": 0.0,  # 0-1 scale
            "technology_readiness": "unknown",
            "estimated_cost_usd": 0,
            "mission_duration_years": lead_time_years + 2,  # Add mission time
            "success_probability": 0.0,
            "challenges": []
        }
        
        if method == "kinetic":
            # Kinetic impactor missions (like DART)
            feasibility["technology_readiness"] = "demonstrated"
            feasibility["estimated_cost_usd"] = 500e6  # ~$500M like DART
            feasibility["success_probability"] = 0.8
            
            if delta_v_cm_s > 1000:  # Very large delta-V needed
                feasibility["challenges"].append("Requires multiple impactors")
                feasibility["success_probability"] *= 0.7
            
            if lead_time_years < 5:
                feasibility["challenges"].append("Short lead time limits effectiveness")
                feasibility["success_probability"] *= 0.8
        
        elif method == "tractor":
            # Gravity tractor
            feasibility["technology_readiness"] = "concept"
            feasibility["estimated_cost_usd"] = 2e9  # Much more expensive
            feasibility["success_probability"] = 0.6
            feasibility["challenges"].append("Requires very long mission duration")
            
            if lead_time_years < 20:
                feasibility["challenges"].append("Gravity tractor needs decades to be effective")
                feasibility["success_probability"] *= 0.5
        
        elif method == "standoff":
            # Nuclear standoff
            feasibility["technology_readiness"] = "theoretical"
            feasibility["estimated_cost_usd"] = 5e9  # Very expensive
            feasibility["success_probability"] = 0.4  # High risk
            feasibility["challenges"].extend([
                "Requires nuclear weapons in space",
                "International treaties may prohibit",
                "High technical risk"
            ])
        
        # Calculate overall score
        time_factor = min(1.0, lead_time_years / 10)  # Better with more time
        tech_factor = {"demonstrated": 1.0, "concept": 0.6, "theoretical": 0.3}[feasibility["technology_readiness"]]
        feasibility["overall_score"] = feasibility["success_probability"] * time_factor * tech_factor
        
        return feasibility