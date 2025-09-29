export const FEATURED_LOCATIONS = [
  {
    id: 'nyc',
    name: 'New York City',
    latitude: 40.7128,
    longitude: -74.006,
    description: 'Northeastern United States',
    preset: {
      diameter_m: 140,
      density_kg_m3: 2500,
      velocity_km_s: 25,
      angle_deg: 30
    }
  },
  {
    id: 'london',
    name: 'London',
    latitude: 51.5072,
    longitude: -0.1276,
    description: 'United Kingdom',
    preset: {
      diameter_m: 90,
      density_kg_m3: 3200,
      velocity_km_s: 19,
      angle_deg: 45
    }
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
    description: 'Japan',
    preset: {
      diameter_m: 110,
      density_kg_m3: 3000,
      velocity_km_s: 21,
      angle_deg: 35
    }
  },
  {
    id: 'sydney',
    name: 'Sydney',
    latitude: -33.8688,
    longitude: 151.2093,
    description: 'Australia',
    preset: {
      diameter_m: 75,
      density_kg_m3: 2800,
      velocity_km_s: 18,
      angle_deg: 40
    }
  },
  {
    id: 'cairo',
    name: 'Cairo',
    latitude: 30.0444,
    longitude: 31.2357,
    description: 'Egypt',
    preset: {
      diameter_m: 160,
      density_kg_m3: 2600,
      velocity_km_s: 23,
      angle_deg: 25
    }
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro',
    latitude: -22.9068,
    longitude: -43.1729,
    description: 'Brazil',
    preset: {
      diameter_m: 120,
      density_kg_m3: 2400,
      velocity_km_s: 26,
      angle_deg: 35
    }
  },
  {
    id: 'nairobi',
    name: 'Nairobi',
    latitude: -1.2864,
    longitude: 36.8172,
    description: 'Kenya',
    preset: {
      diameter_m: 95,
      density_kg_m3: 2700,
      velocity_km_s: 22,
      angle_deg: 40
    }
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    latitude: 19.076,
    longitude: 72.8777,
    description: 'India',
    preset: {
      diameter_m: 130,
      density_kg_m3: 3000,
      velocity_km_s: 24,
      angle_deg: 30
    }
  }
]

export const DEFAULT_LOCATION = FEATURED_LOCATIONS[0]
