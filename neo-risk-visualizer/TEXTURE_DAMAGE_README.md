# Texture Damage Analysis Feature

## Overview

The Texture Damage Analysis feature adds comprehensive material vulnerability calculations to the asteroid impact simulation system. This feature analyzes how different materials and textures respond to blast pressure and thermal radiation, providing detailed insights into structural vulnerabilities and human impact consequences.

## Features

### 🧬 Material Damage Calculations
- **8 Material Types**: Glass, wood, concrete, steel, brick, asphalt, vegetation, and fabric
- **Dual-Factor Analysis**: Combines blast pressure and thermal flux effects
- **Uncertainty Quantification**: Provides confidence intervals (P5, P50, P95) for all calculations
- **Physics-Based**: Uses scientifically-grounded damage thresholds

### 💥 Damage Mechanisms
- **Blast Pressure Effects**: Material failure under overpressure
- **Thermal Radiation**: Heat-induced damage and ignition
- **Combined Effects**: Takes maximum of thermal and blast damage radii
- **Angle Correction**: Accounts for grazing vs. vertical impacts

### 🩸 Flesh & Consequences Schema
Each material includes detailed consequence analysis:
- **Glass**: Projectile hazards causing lacerations and eye injuries
- **Concrete/Steel**: Structural collapse leading to crushing trauma
- **Wood**: Splinter injuries and blunt force trauma
- **Fabric**: Thermal burns and exposure-related injuries

## Implementation

### Backend (Python)

#### New Models
```python
class TextureEffect(BaseModel):
    material_type: str
    damage_threshold: float
    damage_percentage: UncertaintyBand
    r_km: UncertaintyBand
    description: str
    consequences: str
```

#### Physics Calculations
Located in `backend/physics/impact_effects.py`:
- Material-specific pressure thresholds (0.05 - 5.0 PSI)
- Thermal flux thresholds (30,000 - 300,000 J/m²)
- Combined radius calculations with angle corrections
- Damage percentage based on distance from impact

#### API Integration
- Extended `/simulate` endpoint to include texture effects
- Added to simulation response under `effects.texture`
- Maintains backward compatibility with existing clients

### Frontend (React)

#### UI Components
- **DamageSummary Component**: Displays texture damage in collapsible section
- **Material Cards**: Individual cards showing damage percentage and consequences
- **Consequences Schema**: Background information panel explaining flesh effects

#### Visual Features
- Material-specific icons (🪟 glass, 🏗️ concrete, etc.)
- Color-coded damage percentages
- Expandable consequences descriptions
- Responsive grid layout

## Usage Examples

### API Request
```json
POST /simulate
{
  "lat": 40.7,
  "lon": -74.0,
  "diameter_m": 100,
  "density_kg_m3": 2500,
  "velocity_km_s": 20,
  "angle_deg": 45
}
```

### API Response (Texture Effects)
```json
{
  "effects": {
    "texture": [
      {
        "material_type": "glass",
        "damage_threshold": 0.1,
        "damage_percentage": {
          "p5": 2.0,
          "p50": 2.8,
          "p95": 3.6
        },
        "r_km": {
          "p5": 282.9,
          "p50": 353.6,
          "p95": 424.3
        },
        "description": "Window shattering and glass damage",
        "consequences": "Flying glass fragments causing severe lacerations, eye injuries, and puncture wounds"
      }
    ]
  }
}
```

## Material Damage Thresholds

| Material   | Pressure (PSI) | Thermal (J/m²) | Primary Effect |
|------------|----------------|----------------|----------------|
| Glass      | 0.1            | 50,000         | Window shattering |
| Fabric     | 0.05           | 30,000         | Thermal ignition |
| Vegetation | 0.2            | 80,000         | Debris projectiles |
| Asphalt    | 1.0            | 100,000        | Surface damage |
| Wood       | 0.5            | 125,000        | Structural damage |
| Brick      | 1.5            | 150,000        | Wall collapse |
| Concrete   | 2.0            | 200,000        | Spalling/cracking |
| Steel      | 5.0            | 300,000        | Deformation |

## Testing

### Validation Tests
```bash
cd backend
python -c "from physics.impact_effects import ImpactEffectsCalculator; ..."
```

### Demo Interface
Access the standalone demo at: `http://localhost:8080/texture_damage_demo.html`

## Scientific Basis

### Damage Calculations
- **Blast Effects**: Based on Glasstone & Dolan (1977) scaling laws
- **Thermal Effects**: Uses Stefan-Boltzmann radiation principles
- **Material Thresholds**: Derived from structural engineering standards
- **Human Impact**: Based on medical trauma research

### Uncertainty Modeling
- **Monte Carlo Sampling**: 1000 iterations for statistical confidence
- **Parameter Uncertainties**: 10% diameter, 20% density, 5% velocity
- **Combined Propagation**: Uncertainty carries through all calculations

## Future Enhancements

### Planned Features
- **Soil Liquefaction**: Ground instability effects
- **Infrastructure Cascades**: Secondary failure propagation
- **Population Density Weighting**: Location-specific vulnerability
- **Seasonal Variations**: Weather-dependent damage patterns

### Integration Opportunities
- **GIS Systems**: Detailed geographical material mapping
- **Emergency Response**: Real-time evacuation planning
- **Urban Planning**: Resilience assessment tools
- **Insurance Modeling**: Risk quantification

## Technical Notes

### Performance
- Calculation time: ~10-50ms for full texture analysis
- Memory usage: Minimal additional overhead
- Scalability: Linear with number of materials

### Accuracy
- **Simplified Physics**: Suitable for rapid assessment, not detailed engineering
- **Material Approximations**: Generic properties, not site-specific
- **Distance Effects**: Atmospheric attenuation not fully modeled

## Dependencies

### Backend
- `numpy`: Numerical calculations and uncertainty propagation
- `pydantic`: Data validation and API models
- `fastapi`: Web API framework

### Frontend
- `react`: UI framework
- `tailwindcss`: Styling system

## License & Disclaimer

This feature is part of the IMPACTOR-2025 demonstration system developed for the NASA Space Apps Challenge. The physics models are simplified for rapid prototyping and educational purposes. For operational emergency planning, detailed site-specific analysis with peer-reviewed models is required.