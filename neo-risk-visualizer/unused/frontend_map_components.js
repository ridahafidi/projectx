// src/components/Map/ImpactMap.jsx
import React, { useState, useCallback, useRef } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl'
import { Target, MapPin } from 'lucide-react'
import EffectRings from './EffectRings'
import PopulationOverlay from './PopulationOverlay'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const ImpactMap = ({ 
  simulationData, 
  mitigationData, 
  onLocationSelect, 
  selectedLocation 
}) => {
  const [viewState, setViewState] = useState({
    longitude: selectedLocation?.lng || -74.0060,
    latitude: selectedLocation?.lat || 40.7128,
    zoom: 8,
    pitch: 0,
    bearing: 0
  })
  
  const [showPopulation, setShowPopulation] = useState(true)
  const [showUncertainty, setShowUncertainty] = useState(true)
  const mapRef = useRef()

  const handleMapClick = useCallback((event) => {
    const { lng, lat } = event.lngLat
    onLocationSelect({ lng, lat })
    
    // Animate to clicked location
    setViewState(prev => ({
      ...prev,
      longitude: lng,
      latitude: lat,
      zoom: Math.max(prev.zoom, 8)
    }))
  }, [onLocationSelect])

  // If no Mapbox token, show fallback
  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
        <div className="text-center p-8">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Map Unavailable</h3>
          <p className="text-gray-400 mb-4">
            Mapbox token not configured. Add VITE_MAPBOX_TOKEN to your .env file.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 max-w-md">
            <p className="text-sm text-gray-300">
              Selected Location: {selectedLocation ? 
                `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}` : 
                'Click to select'
              }
            </p>
            {simulationData && (
              <div className="mt-2 text-xs text-gray-400">
                Impact simulation data available
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        className="w-full h-full"
        cursor="crosshair"
      >
        {/* Population Overlay */}
        {showPopulation && (
          <PopulationOverlay />
        )}

        {/* Impact Location Marker */}
        {selectedLocation && (
          <Marker
            longitude={selectedLocation.lng}
            latitude={selectedLocation.lat}
            anchor="center"
          >
            <div className="relative">
              <Target className="h-8 w-8 text-danger animate-pulse" />
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                Impact Point
              </div>
            </div>
          </Marker>
        )}

        {/* Effect Rings */}
        {simulationData && selectedLocation && (
          <EffectRings
            center={[selectedLocation.lng, selectedLocation.lat]}
            effects={simulationData.effects}
            showUncertainty={showUncertainty}
          />
        )}

        {/* Mitigation Corridor */}
        {mitigationData && selectedLocation && (
          <Source
            id="mitigation-corridor"
            type="geojson"
            data={{
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [
                  [selectedLocation.lng - 0.1, selectedLocation.lat],
                  [selectedLocation.lng + 0.1, selectedLocation.lat]
                ]
              }
            }}
          >
            <Layer
              id="corridor-line"
              type="line"
              paint={{
                'line-color': '#10b981',
                'line-width': 3,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}
      </Map>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 space-y-2">
        <div className="text-xs text-white font-medium">Map Layers</div>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showPopulation}
            onChange={(e) => setShowPopulation(e.target.checked)}
            className="w-4 h-4 text-warning bg-gray-800 border-gray-600 rounded focus:ring-warning"
          />
          <span className="text-xs text-gray-300">Population Density</span>
        </label>
        
        {simulationData && (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUncertainty}
              onChange={(e) => setShowUncertainty(e.target.checked)}
              className="w-4 h-4 text-warning bg-gray-800 border-gray-600 rounded focus:ring-warning"
            />
            <span className="text-xs text-gray-300">Uncertainty Bands</span>
          </label>
        )}
      </div>

      {/* Click Instructions */}
      {!selectedLocation && (
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3">
          <p className="text-sm text-gray-300">
            <Target className="inline h-4 w-4 mr-1" />
            Click anywhere on the map to set impact location
          </p>
        </div>
      )}

      {/* Coordinate Display */}
      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2">
        <div className="text-xs text-gray-300">
          {selectedLocation ? (
            `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`
          ) : (
            'No location selected'
          )}
        </div>
      </div>
    </div>
  )
}

export default ImpactMap

// src/components/Map/EffectRings.jsx
import React from 'react'
import { Source, Layer } from 'react-map-gl'

const EffectRings = ({ center, effects, showUncertainty = true }) => {
  if (!effects || !center) return null

  const [lng, lat] = center

  // Create circle geometry for each effect
  const createCircle = (centerLng, centerLat, radiusKm) => {
    const points = []
    const steps = 64
    
    for (let i = 0; i <= steps; i++) {
      const angle = (i * 2 * Math.PI) / steps
      const dx = radiusKm * Math.cos(angle) / 111.32 // Rough conversion to degrees
      const dy = radiusKm * Math.sin(angle) / 110.54
      
      points.push([
        centerLng + dx / Math.cos(centerLat * Math.PI / 180),
        centerLat + dy
      ])
    }
    
    return points
  }

  const rings = []

  // Blast effect rings
  if (effects.blast) {
    effects.blast.forEach((blast, index) => {
      const radiusKm = blast.r_km.p50
      const minRadius = showUncertainty ? blast.r_km.p5 : radiusKm
      const maxRadius = showUncertainty ? blast.r_km.p95 : radiusKm
      
      // Main ring
      rings.push({
        id: `blast-${index}`,
        type: 'blast',
        radius: radiusKm,
        color: '#dc2626',
        opacity: 0.3,
        strokeColor: '#dc2626',
        label: `${blast.psi} PSI`
      })
      
      // Uncertainty band
      if (showUncertainty && minRadius !== maxRadius) {
        rings.push({
          id: `blast-uncertainty-min-${index}`,
          type: 'uncertainty',
          radius: minRadius,
          color: '#dc2626',
          opacity: 0.1,
          strokeColor: '#dc2626',
          strokeDash: [2, 2]
        })
        
        rings.push({
          id: `blast-uncertainty-max-${index}`,
          type: 'uncertainty', 
          radius: maxRadius,
          color: '#dc2626',
          opacity: 0.1,
          strokeColor: '#dc2626',
          strokeDash: [2, 2]
        })
      }
    })
  }

  // Thermal effect rings
  if (effects.thermal) {
    effects.thermal.forEach((thermal, index) => {
      const radiusKm = thermal.r_km.p50
      
      rings.push({
        id: `thermal-${index}`,
        type: 'thermal',
        radius: radiusKm,
        color: '#f97316',
        opacity: 0.2,
        strokeColor: '#f97316',
        label: `${Math.round(thermal.J_m2 / 1000)} kJ/m²`
      })
    })
  }

  // Crater ring
  if (effects.crater) {
    const radiusKm = effects.crater.rim_r_km.p50
    
    rings.push({
      id: 'crater',
      type: 'crater',
      radius: radiusKm,
      color: '#eab308',
      opacity: 0.4,
      strokeColor: '#eab308',
      label: 'Crater Rim'
    })
  }

  return (
    <>
      {rings.map(ring => (
        <Source
          key={ring.id}
          id={ring.id}
          type="geojson"
          data={{
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [createCircle(lng, lat, ring.radius)]
            },
            properties: {
              type: ring.type,
              label: ring.label
            }
          }}
        >
          <Layer
            id={`${ring.id}-fill`}
            type="fill"
            paint={{
              'fill-color': ring.color,
              'fill-opacity': ring.opacity
            }}
          />
          <Layer
            id={`${ring.id}-stroke`}
            type="line"
            paint={{
              'line-color': ring.strokeColor,
              'line-width': 2,
              'line-opacity': 0.8,
              ...(ring.strokeDash && {
                'line-dasharray': ring.strokeDash
              })
            }}
          />
        </Source>
      ))}
    </>
  )
}

export default EffectRings

// src/components/Map/PopulationOverlay.jsx
import React from 'react'
import { Source, Layer } from 'react-map-gl'

const PopulationOverlay = () => {
  // In a real implementation, this would load actual population raster data
  // For demo purposes, we'll show major population centers as circles
  
  const majorCities = [
    { name: "New York", lng: -74.0060, lat: 40.7128, population: 8400000 },
    { name: "Los Angeles", lng: -118.2437, lat: 34.0522, population: 3900000 },
    { name: "Chicago", lng: -87.6298, lat: 41.8781, population: 2700000 },
    { name: "Houston", lng: -95.3698, lat: 29.7604, population: 2300000 },
    { name: "Phoenix", lng: -112.0740, lat: 33.4484, population: 1700000 },
    { name: "Philadelphia", lng: -75.1652, lat: 39.9526, population: 1600000 },
    { name: "San Antonio", lng: -98.4936, lat: 29.4241, population: 1500000 },
    { name: "San Diego", lng: -117.1611, lat: 32.7157, population: 1400000 },
    { name: "Dallas", lng: -96.7970, lat: 32.7767, population: 1300000 },
    { name: "San Jose", lng: -121.8863, lat: 37.3382, population: 1000000 },
  ]

  const cityFeatures = majorCities.map(city => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [city.lng, city.lat]
    },
    properties: {
      name: city.name,
      population: city.population
    }
  }))

  return (
    <Source
      id="population-centers"
      type="geojson"
      data={{
        type: "FeatureCollection",
        features: cityFeatures
      }}
    >
      <Layer
        id="population-circles"
        type="circle"
        paint={{
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'population'],
            500000, 8,
            2000000, 12,
            5000000, 16,
            10000000, 20
          ],
          'circle-color': '#3b82f6',
          'circle-opacity': 0.6,
          'circle-stroke-color': '#1e40af',
          'circle-stroke-width': 1
        }}
      />
    </Source>
  )
}

export default PopulationOverlay

// src/components/Mitigation/MitigationPanel.jsx
import React, { useState } from 'react'
import { Shield, Zap, Clock, DollarSign, AlertTriangle } from 'lucide-react'
import { api } from '../../services/api'
import { formatNumber } from '../../utils/formatters'
import LoadingSpinner from '../Common/LoadingSpinner'
import InfoTooltip from '../Common/InfoTooltip'
import ComparisonView from './ComparisonView'

const MitigationPanel = ({ simulationData, onMitigationComplete, onError }) => {
  const [mitigationParams, setMitigationParams] = useState({
    delta_v_cm_s: 100,
    lead_time_years: 10,
    method: 'kinetic',
    asteroid_diameter_m: 100
  })
  
  const [mitigationResults, setMitigationResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const methods = [
    {
      id: 'kinetic',
      name: 'Kinetic Impactor',
      icon: <Zap className="h-4 w-4" />,
      description: 'High-speed spacecraft collision (like DART mission)',
      pros: ['Proven technology', 'Relatively low cost', 'Fast deployment'],
      cons: ['Limited effectiveness for large asteroids', 'Requires precise targeting']
    },
    {
      id: 'tractor',
      name: 'Gravity Tractor',
      icon: <Shield className="h-4 w-4" />,
      description: 'Spacecraft uses gravity to slowly pull asteroid off course',
      pros: ['Very precise control', 'No debris creation', 'Scalable'],
      cons: ['Very long mission duration', 'High cost', 'Technology still developing']
    },
    {
      id: 'standoff',
      name: 'Nuclear Standoff',
      icon: <AlertTriangle className="h-4 w-4" />,
      description: 'Nuclear explosion near asteroid (not direct impact)',
      pros: ['Extremely powerful', 'Effective for large asteroids'],
      cons: ['International treaties', 'High risk', 'Creates radioactive debris']
    }
  ]

  const handleParameterChange = (key, value) => {
    setMitigationParams(prev => ({
      ...prev,
      [key]: parseFloat(value) || value
    }))
  }

  const handleSimulateDeflection = async () => {
    if (!simulationData) {
      onError(new Error('Run impact simulation first'))
      return
    }

    try {
      setIsLoading(true)
      
      const params = {
        ...mitigationParams,
        original_trajectory: {
          target_lat: simulationData.metadata?.target_lat || 0,
          target_lon: simulationData.metadata?.target_lon || 0
        }
      }
      
      const result = await api.simulateDeflection(params)
      setMitigationResults(result)
      onMitigationComplete(result)
      
    } catch (error) {
      onError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedMethod = methods.find(m => m.id === mitigationParams.method)

  return (
    <div className="space-y-6">
      {!simulationData && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
            <span className="text-sm text-yellow-200">
              Run an impact simulation first to enable mitigation analysis
            </span>
          </div>
        </div>
      )}

      {/* Method Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-safe" />
          Deflection Method
        </h3>
        
        <div className="space-y-3">
          {methods.map(method => (
            <label key={method.id} className="block cursor-pointer">
              <input
                type="radio"
                name="method"
                value={method.id}
                checked={mitigationParams.method === method.id}
                onChange={(e) => handleParameterChange('method', e.target.value)}
                className="sr-only"
              />
              <div className={`p-3 border rounded-lg transition-colors ${
                mitigationParams.method === method.id
                  ? 'border-safe bg-green-900/20'
                  : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {method.icon}
                    <span className="ml-2 font-medium">{method.name}</span>
                  </div>
                  <InfoTooltip content={
                    <div className="space-y-2">
                      <div><strong>Pros:</strong> {method.pros.join(', ')}</div>
                      <div><strong>Cons:</strong> {method.cons.join(', ')}</div>
                    </div>
                  }>
                    <span className="text-gray-400 cursor-help">ⓘ</span>
                  </InfoTooltip>
                </div>
                <p className="text-sm text-gray-300">{method.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Mission Parameters */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Mission Parameters</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-300">Delta-V (cm/s)</label>
              <InfoTooltip content="Velocity change imparted to asteroid. Higher values need more powerful missions.">
                <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
              </InfoTooltip>
            </div>
            <input
              type="range"
              value={mitigationParams.delta_v_cm_s}
              onChange={(e) => handleParameterChange('delta_v_cm_s', e.target.value)}
              min="1"
              max="1000"
              step="1"
              className="w-full accent-safe"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span className="font-semibold text-safe">{mitigationParams.delta_v_cm_s} cm/s</span>
              <span>1000</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-300">Lead Time (years)</label>
              <InfoTooltip content="Time before impact to execute mission. Longer lead times are exponentially more effective.">
                <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
              </InfoTooltip>
            </div>
            <input
              type="range"
              value={mitigationParams.lead_time_years}
              onChange={(e) => handleParameterChange('lead_time_years', e.target.value)}
              min="1"
              max="50"
              step="1"
              className="w-full accent-safe"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span className="font-semibold text-safe">{mitigationParams.lead_time_years} years</span>
              <span>50</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Asteroid Diameter (m)</label>
            <input
              type="number"
              value={mitigationParams.asteroid_diameter_m}
              onChange={(e) => handleParameterChange('asteroid_diameter_m', e.target.value)}
              min="1"
              max="2000"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-safe focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Simulate Button */}
      <button
        onClick={handleSimulateDeflection}
        disabled={!simulationData || isLoading}
        className="w-full bg-safe hover:bg-green-600 disabled:bg-gray-600 text-black font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
      >
        <Shield className="h-5 w-5 mr-2" />
        {isLoading ? 'Simulating Mission...' : 'Simulate Deflection Mission'}
      </button>

      {isLoading && (
        <div className="flex justify-center py-4">
          <LoadingSpinner text="Calculating deflection effectiveness..." />
        </div>
      )}

      {/* Results */}
      {mitigationResults && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Mission Results</h3>
          
          {/* Success Classification */}
          <div className={`p-4 rounded-lg border ${
            mitigationResults.classification === 'clear' ? 'bg-green-900/30 border-safe' :
            mitigationResults.classification === 'miss' ? 'bg-yellow-900/30 border-warning' :
            'bg-red-900/30 border-danger'
          }`}>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                {mitigationResults.classification === 'clear' && '✅ Mission Success'}
                {mitigationResults.classification === 'miss' && '⚠️ Probable Miss'}
                {mitigationResults.classification === 'hit' && '❌ Insufficient Deflection'}
              </div>
              <div className="text-sm opacity-80">
                Impact probability reduced by {(mitigationResults.impact_probability_drop * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Mission Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <Clock className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-sm text-gray-300">Corridor Shift</span>
              </div>
              <div className="text-lg font-semibold text-blue-400">
                {formatNumber(mitigationResults.corridor_shift_km)} km
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <DollarSign className="h-4 w-4 text-yellow-400 mr-2" />
                <span className="text-sm text-gray-300">Mission Cost</span>
              </div>
              <div className="text-lg font-semibold text-yellow-400">
                ${formatNumber(mitigationResults.mission_feasibility?.estimated_cost_usd || 0)}
              </div>
            </div>
          </div>

          {/* Feasibility Assessment */}
          {mitigationResults.mission_feasibility && (
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <h4 className="font-medium mb-3">Mission Feasibility</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Overall Score</span>
                  <span className={`font-semibold ${
                    mitigationResults.mission_feasibility.overall_score > 0.7 ? 'text-safe' :
                    mitigationResults.mission_feasibility.overall_score > 0.4 ? 'text-warning' :
                    'text-danger'
                  }`}>
                    {(mitigationResults.mission_feasibility.overall_score * 100).toFixed(0)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Technology Readiness</span>
                  <span className="text-sm capitalize">{mitigationResults.mission_feasibility.technology_readiness}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Success Probability</span>
                  <span className="text-sm">{(mitigationResults.mission_feasibility.success_probability * 100).toFixed(0)}%</span>
                </div>
                
                {mitigationResults.mission_feasibility.challenges?.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-300 mb-1">Key Challenges</div>
                    <div className="text-xs text-gray-400">
                      {mitigationResults.mission_feasibility.challenges.join(' • ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison View */}
      {simulationData && mitigationResults && (
        <ComparisonView
          beforeData={simulationData}
          afterData={mitigationResults}
        />
      )}
    </div>
  )
}

export default MitigationPanel