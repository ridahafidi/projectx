// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

class ApiError extends Error {
  constructor(message, status = 500) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        response.status
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(`Network error: ${error.message}`)
  }
}

export const api = {
  // Health check
  async checkHealth() {
    return makeRequest('/health')
  },

  // Simulate asteroid impact
  async simulateImpact(params) {
    return makeRequest('/simulate', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  // Simulate deflection mission
  async simulateDeflection(params) {
    return makeRequest('/deflect', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  // Get asteroid catalog
  async getAsteroids(limit = 50, minDiameter = 10) {
    return makeRequest(`/asteroids?limit=${limit}&min_diameter=${minDiameter}`)
  },

  // Get preset scenarios
  async getPresetScenarios() {
    return makeRequest('/scenarios/presets')
  },
}

// src/utils/formatters.js
export function formatNumber(num, precision = 0) {
  if (num === null || num === undefined) return 'N/A'
  
  if (Math.abs(num) >= 1e9) {
    return `${(num / 1e9).toFixed(precision)}B`
  } else if (Math.abs(num) >= 1e6) {
    return `${(num / 1e6).toFixed(precision)}M`
  } else if (Math.abs(num) >= 1e3) {
    return `${(num / 1e3).toFixed(precision)}K`
  } else {
    return num.toLocaleString(undefined, { maximumFractionDigits: precision })
  }
}

export function formatDistance(km) {
  if (km < 1) {
    return `${(km * 1000).toFixed(0)} m`
  } else if (km < 10) {
    return `${km.toFixed(1)} km`
  } else {
    return `${km.toFixed(0)} km`
  }
}

export function formatEnergy(joules) {
  const megatons = joules / (4.184e15) // Convert to megatons TNT
  if (megatons < 0.001) {
    const kilotons = megatons * 1000
    return `${kilotons.toFixed(1)} kilotons TNT`
  } else if (megatons < 1) {
    return `${megatons.toFixed(2)} megatons TNT`
  } else {
    return `${megatons.toFixed(0)} megatons TNT`
  }
}

export function getRiskColor(value, thresholds = { low: 0.2, medium: 0.6 }) {
  if (value <= thresholds.low) return 'text-safe'
  if (value <= thresholds.medium) return 'text-warning'
  return 'text-danger'
}

// src/components/Common/LoadingSpinner.jsx
import React from 'react'

const LoadingSpinner = ({ size = 'md', text = 'Calculating impact effects...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className={`animate-spin rounded-full border-2 border-gray-600 border-t-warning ${sizeClasses[size]}`} />
      {text && <p className="text-sm text-gray-400 animate-pulse">{text}</p>}
    </div>
  )
}

export default LoadingSpinner

// src/components/Common/InfoTooltip.jsx
import React, { useState } from 'react'

const InfoTooltip = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 transform -translate-y-1/2'
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      
      {isVisible && (
        <div className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap max-w-xs ${positionClasses[position]}`}>
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45" 
               style={{
                 [position === 'top' ? 'bottom' : position === 'bottom' ? 'top' : position === 'left' ? 'right' : 'left']: '-4px',
                 [position === 'top' || position === 'bottom' ? 'left' : 'top']: '50%',
                 transform: 'translate(-50%, 0) rotate(45deg)'
               }}
          />
        </div>
      )}
    </div>
  )
}

export default InfoTooltip

// src/components/Simulation/ParameterPanel.jsx
import React, { useState, useEffect } from 'react'
import { Play, RotateCcw, MapPin } from 'lucide-react'
import { api } from '../../services/api'
import InfoTooltip from '../Common/InfoTooltip'

const ParameterPanel = ({ selectedLocation, onSimulationStart, onSimulationComplete, onError }) => {
  const [parameters, setParameters] = useState({
    lat: 40.7128,
    lon: -74.0060,
    diameter_m: 100,
    density_kg_m3: 2500,
    velocity_km_s: 20,
    angle_deg: 45
  })
  
  const [presets, setPresets] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load preset scenarios
    api.getPresetScenarios()
      .then(data => setPresets(data.presets))
      .catch(console.error)
  }, [])

  useEffect(() => {
    // Update location when map is clicked
    if (selectedLocation) {
      setParameters(prev => ({
        ...prev,
        lat: selectedLocation.lat,
        lon: selectedLocation.lng
      }))
    }
  }, [selectedLocation])

  const handleParameterChange = (key, value) => {
    setParameters(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }))
  }

  const handlePresetSelect = (preset) => {
    setParameters(prev => ({
      ...prev,
      diameter_m: preset.diameter_m,
      density_kg_m3: preset.density_kg_m3,
      velocity_km_s: preset.velocity_km_s,
      angle_deg: preset.angle_deg
    }))
  }

  const handleSimulate = async () => {
    try {
      setIsLoading(true)
      onSimulationStart()
      
      const result = await api.simulateImpact(parameters)
      onSimulationComplete(result)
    } catch (error) {
      onError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetToDefaults = () => {
    setParameters({
      lat: 40.7128,
      lon: -74.0060,
      diameter_m: 100,
      density_kg_m3: 2500,
      velocity_km_s: 20,
      angle_deg: 45
    })
  }

  return (
    <div className="space-y-6">
      {/* Location */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-warning" />
          Impact Location
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Latitude</label>
            <input
              type="number"
              value={parameters.lat}
              onChange={(e) => handleParameterChange('lat', e.target.value)}
              step="0.0001"
              min="-90"
              max="90"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-warning focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Longitude</label>
            <input
              type="number"
              value={parameters.lon}
              onChange={(e) => handleParameterChange('lon', e.target.value)}
              step="0.0001"
              min="-180"
              max="180"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-warning focus:outline-none"
            />
          </div>
        </div>
        
        <p className="text-xs text-gray-400 mt-1">
          Click on the map to select impact location
        </p>
      </div>

      {/* Asteroid Parameters */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Asteroid Properties</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-300">Diameter (meters)</label>
              <InfoTooltip content="Asteroid diameter affects impact energy. Larger asteroids create more widespread damage.">
                <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
              </InfoTooltip>
            </div>
            <input
              type="range"
              value={parameters.diameter_m}
              onChange={(e) => handleParameterChange('diameter_m', e.target.value)}
              min="1"
              max="2000"
              step="1"
              className="w-full accent-warning"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1m</span>
              <span className="font-semibold text-warning">{parameters.diameter_m}m</span>
              <span>2km</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-300">Density (kg/m³)</label>
              <InfoTooltip content="Material density affects impact energy. Rocky asteroids ~2500, metallic ~5000, icy ~1000 kg/m³">
                <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
              </InfoTooltip>
            </div>
            <input
              type="range"
              value={parameters.density_kg_m3}
              onChange={(e) => handleParameterChange('density_kg_m3', e.target.value)}
              min="1000"
              max="8000"
              step="100"
              className="w-full accent-warning"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1000</span>
              <span className="font-semibold text-warning">{parameters.density_kg_m3}</span>
              <span>8000</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-300">Velocity (km/s)</label>
              <InfoTooltip content="Impact velocity. Earth's escape velocity is 11 km/s minimum. Typical asteroid impacts: 15-25 km/s">
                <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
              </InfoTooltip>
            </div>
            <input
              type="range"
              value={parameters.velocity_km_s}
              onChange={(e) => handleParameterChange('velocity_km_s', e.target.value)}
              min="11"
              max="50"
              step="0.5"
              className="w-full accent-warning"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>11</span>
              <span className="font-semibold text-warning">{parameters.velocity_km_s}</span>
              <span>50</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-300">Impact Angle (degrees)</label>
              <InfoTooltip content="Angle from horizontal. Shallow angles (15°) create elongated damage. Steep angles (90°) maximize crater size.">
                <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
              </InfoTooltip>
            </div>
            <input
              type="range"
              value={parameters.angle_deg}
              onChange={(e) => handleParameterChange('angle_deg', e.target.value)}
              min="15"
              max="90"
              step="5"
              className="w-full accent-warning"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>15°</span>
              <span className="font-semibold text-warning">{parameters.angle_deg}°</span>
              <span>90°</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Scenarios */}
      {presets.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Preset Scenarios</h3>
          <div className="space-y-2">
            {presets.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetSelect(preset)}
                className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 hover:border-warning transition-colors"
              >
                <div className="font-medium text-warning">{preset.name}</div>
                <div className="text-xs text-gray-400 mt-1">{preset.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {preset.diameter_m}m • {preset.velocity_km_s} km/s • {preset.angle_deg}°
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={handleSimulate}
          disabled={isLoading}
          className="flex-1 bg-warning hover:bg-yellow-600 disabled:bg-gray-600 text-black font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          <Play className="h-5 w-5 mr-2" />
          {isLoading ? 'Simulating...' : 'Simulate Impact'}
        </button>
        
        <button
          onClick={resetToDefaults}
          disabled={isLoading}
          className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
        <p className="text-xs text-gray-400">
          <strong>⚠️ Disclaimer:</strong> This tool uses simplified physics models for educational purposes. 
          Real impact assessment requires detailed geological surveys, atmospheric modeling, and peer-reviewed analysis.
        </p>
      </div>
    </div>
  )
}

export default ParameterPanel

// src/components/Simulation/ResultsPanel.jsx
import React from 'react'
import { TrendingUp, Users, Zap, Mountain } from 'lucide-react'
import { formatNumber, formatDistance, getRiskColor } from '../../utils/formatters'
import InfoTooltip from '../Common/InfoTooltip'

const ResultsPanel = ({ data }) => {
  if (!data) return null

  const { effects, exposure, metadata } = data

  const getEffectIcon = (type) => {
    switch (type) {
      case 'blast': return <Zap className="h-4 w-4" />
      case 'thermal': return <TrendingUp className="h-4 w-4" />
      case 'crater': return <Mountain className="h-4 w-4" />
      default: return null
    }
  }

  const getEffectColor = (type) => {
    switch (type) {
      case 'blast': return 'text-red-400'
      case 'thermal': return 'text-orange-400' 
      case 'crater': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Energy Summary */}
      {metadata?.energy_tnt_tons && (
        <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-warning" />
            Impact Energy
          </h3>
          <div className="text-2xl font-bold text-warning">
            {formatNumber(metadata.energy_tnt_tons.p50)} tons TNT
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Range: {formatNumber(metadata.energy_tnt_tons.p5)} - {formatNumber(metadata.energy_tnt_tons.p95)} tons
          </div>
        </div>
      )}

      {/* Blast Effects */}
      {effects.blast && effects.blast.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-red-400" />
            Blast Effects
          </h3>
          <div className="space-y-2">
            {effects.blast.map((effect, index) => (
              <div key={index} className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-red-400">{effect.psi} PSI</span>
                  <span className="text-sm font-semibold">
                    {formatDistance(effect.r_km.p50)}
                  </span>
                </div>
                <div className="text-sm text-gray-300 mb-2">{effect.description}</div>
                <div className="text-xs text-gray-400">
                  Range: {formatDistance(effect.r_km.p5)} - {formatDistance(effect.r_km.p95)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Thermal Effects */}
      {effects.thermal && effects.thermal.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-orange-400" />
            Thermal Effects
          </h3>
          <div className="space-y-2">
            {effects.thermal.map((effect, index) => (
              <div key={index} className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-orange-400">
                    {formatNumber(effect.J_m2 / 1000)} kJ/m²
                  </span>
                  <span className="text-sm font-semibold">
                    {formatDistance(effect.r_km.p50)}
                  </span>
                </div>
                <div className="text-sm text-gray-300 mb-2">{effect.description}</div>
                <div className="text-xs text-gray-400">
                  Range: {formatDistance(effect.r_km.p5)} - {formatDistance(effect.r_km.p95)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crater Effects */}
      {effects.crater && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Mountain className="h-5 w-5 mr-2 text-yellow-400" />
            Crater Formation
          </h3>
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-300">Rim Radius</div>
                <div className="font-semibold text-yellow-400">
                  {formatDistance(effects.crater.rim_r_km.p50)}
                </div>
                <div className="text-xs text-gray-400">
                  {formatDistance(effects.crater.rim_r_km.p5)} - {formatDistance(effects.crater.rim_r_km.p95)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-300">Depth</div>
                <div className="font-semibold text-yellow-400">
                  {formatDistance(effects.crater.depth_m.p50 / 1000)}
                </div>
                <div className="text-xs text-gray-400">
                  {formatDistance(effects.crater.depth_m.p5 / 1000)} - {formatDistance(effects.crater.depth_m.p95 / 1000)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Population Exposure */}
      {exposure && exposure.population && exposure.population.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-400" />
            Population Exposure
          </h3>
          
          {/* Total Summary */}
          {exposure.total_affected && (
            <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {formatNumber(exposure.total_affected.p50)}
                </div>
                <div className="text-sm text-gray-300">People potentially affected</div>
                <div className="text-xs text-gray-400 mt-1">
                  Range: {formatNumber(exposure.total_affected.range[0])} - {formatNumber(exposure.total_affected.range[1])}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Exposure */}
          <div className="space-y-2">
            {exposure.population.map((exp, index) => (
              <div key={index} className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-300">{exp.description}</span>
                  <span className="font-semibold text-blue-400">
                    {formatNumber(exp.count.p50)}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  Range: {formatNumber(exp.count.range[0])} - {formatNumber(exp.count.range[1])}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {metadata && (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 space-y-1">
            <div>Calculation time: {metadata.calculation_time_ms || 'N/A'}ms</div>
            <div>Uncertainty method: {metadata.uncertainty_method || 'Monte Carlo'}</div>
            <div>Population data year: {metadata.population_year || '2025'}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultsPanel