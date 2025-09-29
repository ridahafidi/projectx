import React, { useState, useCallback } from 'react'
import { AlertTriangle, Zap, Shield, Info, Github, ExternalLink } from 'lucide-react'
import CinematicViewport from './components/CinematicViewport'
import useSimulationFlow, { PHASES } from './store/useSimulationFlow'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-900 flex items-center justify-center p-4">
          <div className="bg-red-800 border border-red-600 rounded-lg p-6 max-w-md">
            <h2 className="text-white font-bold text-xl mb-4">Application Error</h2>
            <p className="text-red-200 mb-4">Something went wrong. Please refresh the page.</p>
            <pre className="text-xs text-red-300 bg-red-950 p-2 rounded overflow-auto">
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
// Import components (we'll create these next)
// import ImpactMap from './components/Map/ImpactMap'
// import ParameterPanel from './components/Simulation/ParameterPanel'
// import ResultsPanel from './components/Simulation/ResultsPanel'
// import MitigationPanel from './components/Mitigation/MitigationPanel'
// import LoadingSpinner from './components/Common/LoadingSpinner'
// import InfoTooltip from './components/Common/InfoTooltip'

// Temporary placeholder components

const ParameterPanel = ({ selectedLocation, onSimulationStart, onSimulationComplete, onError }) => {
  const [parameters, setParameters] = React.useState({
    diameter: 100,
    velocity: 20,
    angle: 45,
    density: 2500
  })
  
  const [isLoading, setIsLoading] = React.useState(false)
  const lat = selectedLocation ? (selectedLocation.lat ?? selectedLocation.latitude) : null
  const lon = selectedLocation ? (selectedLocation.lon ?? selectedLocation.longitude) : null

  const handleSimulation = async () => {
    if (!selectedLocation || lat === null || lon === null) {
      onError("Please select a target location on the map first")
      return
    }

    setIsLoading(true)
    onSimulationStart()

    try {
      // Prepare API request
      const requestData = {
        lat,
        lon,
        diameter_m: parameters.diameter,
        density_kg_m3: parameters.density,
        velocity_km_s: parameters.velocity,
        angle_deg: parameters.angle
      }

      // Make API call to backend
      const response = await fetch('http://localhost:8000/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Process the response to extract key metrics
      const effects = data.effects
      const exposure = data.exposure
      
      // Extract blast effects
      const totalDestruction = effects.blast?.find(b => b.psi >= 20)?.r_km?.p50 || 0
      const heavyDamage = effects.blast?.find(b => b.psi >= 5)?.r_km?.p50 || 0
      const windowBreakage = effects.blast?.find(b => b.psi >= 1)?.r_km?.p50 || 0
      
      // Extract thermal effects  
      const thermalBurns = effects.thermal?.find(t => t.J_m2 >= 500000)?.r_km?.p50 || 0
      
      // Calculate energy based on physics (simple approximation)
      const volume = (4/3) * Math.PI * Math.pow(parameters.diameter/2, 3)
      const mass = volume * parameters.density
      const velocityMs = parameters.velocity * 1000
      const energy = 0.5 * mass * Math.pow(velocityMs, 2)
      const energyTJ = (energy / 1e12).toFixed(1)
      
      // Get total affected population
      const totalAffected = exposure.total_affected?.p50 || 0
      
      // Extract texture effects
      const textureEffects = effects.texture?.map(effect => ({
        material_type: effect.material_type,
        damage_percentage: effect.damage_percentage?.p50 || 0,
        radius_km: effect.r_km?.p50 || 0,
        description: effect.description,
        consequences: effect.consequences
      })) || []
      
      // Format results
      const results = {
        energy: `${energyTJ} TJ`,
        craterDiameter: `${(effects.crater?.rim_r_km?.p50 * 2 || 0).toFixed(1)} km`,
        blastRadius: `${heavyDamage.toFixed(1)} km`,
        thermalRadius: `${thermalBurns.toFixed(1)} km`,
        populationAffected: totalAffected > 1000000 ? `~${Math.round(totalAffected / 1000000)}M` : `~${Math.round(totalAffected / 1000)}k`,
        
        // Include texture effects
        textureEffects: textureEffects,
        
        // Additional details for expanded view
        details: {
          totalDestruction: `${totalDestruction.toFixed(1)} km`,
          heavyDamage: `${heavyDamage.toFixed(1)} km`,
          thermalBurns: `${thermalBurns.toFixed(1)} km`, 
          windowBreakage: `${windowBreakage.toFixed(1)} km`,
          casualties: exposure.casualties || 'Not calculated',
          infrastructure: exposure.infrastructure || 'Not calculated'
        }
      }

      onSimulationComplete(results)
      
    } catch (error) {
      console.error('Simulation failed:', error)
      onError(`Simulation failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Asteroid Parameters
        </h3>
        <p className="text-sm text-gray-400 mt-1">Configure impact scenario</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-panel-dark p-4 space-y-3">
          <label className="block text-sm font-medium text-blue-300">
            <span className="flex items-center gap-2">
              🪨 Asteroid Diameter (m)
            </span>
          </label>
          <input 
            type="number" 
            value={parameters.diameter}
            onChange={(e) => setParameters({...parameters, diameter: parseFloat(e.target.value) || 100})}
            className="space-input w-full"
            placeholder="10 - 10000"
            min="10"
            max="10000"
          />
          
          <label className="block text-sm font-medium text-blue-300">
            <span className="flex items-center gap-2">
              ⚡ Impact Velocity (km/s)
            </span>
          </label>
          <input 
            type="number" 
            value={parameters.velocity}
            onChange={(e) => setParameters({...parameters, velocity: parseFloat(e.target.value) || 20})}
            className="space-input w-full"
            placeholder="5 - 100"
            min="5"
            max="100"
          />
          
          <label className="block text-sm font-medium text-blue-300">
            <span className="flex items-center gap-2">
              📐 Impact Angle (°)
            </span>
          </label>
          <input 
            type="number" 
            value={parameters.angle}
            onChange={(e) => setParameters({...parameters, angle: parseFloat(e.target.value) || 45})}
            className="space-input w-full"
            placeholder="1 - 90"
            min="1"
            max="90"
          />
          
          <label className="block text-sm font-medium text-blue-300">
            <span className="flex items-center gap-2">
              ⚖️ Density (kg/m³)
            </span>
          </label>
          <input 
            type="number" 
            value={parameters.density}
            onChange={(e) => setParameters({...parameters, density: parseFloat(e.target.value) || 2500})}
            className="space-input w-full"
            placeholder="1000 - 8000"
            min="1000"
            max="8000"
          />
        </div>
        
        {selectedLocation && lat !== null && lon !== null && (
          <div className="space-panel-dark p-3 border-l-4 border-warning">
            <div className="text-xs text-gray-400">Impact Location</div>
            <div className="text-sm font-mono text-white">
              {lat.toFixed(4)}°, {lon.toFixed(4)}°
            </div>
          </div>
        )}
        
        <button 
          className={`btn-warning w-full text-lg font-bold glow-warning ${isLoading ? 'opacity-50 cursor-not-allowed' : 'animate-float'}`}
          onClick={handleSimulation}
          disabled={isLoading || lat === null || lon === null}
        >
          {isLoading ? '⏳ CALCULATING...' : '🚀 SIMULATE IMPACT'}
        </button>
      </div>
    </div>
  )
}

const ResultsPanel = ({ data }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
        Impact Assessment
      </h3>
      <p className="text-sm text-gray-400 mt-1">Predicted effects & casualties</p>
    </div>
    
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-panel-dark p-3 text-center glow-danger">
          <div className="text-2xl mb-1">💥</div>
          <div className="text-xs text-gray-400">Energy</div>
          <div className="text-lg font-bold text-red-400">{data.energy}</div>
        </div>
        
        <div className="space-panel-dark p-3 text-center">
          <div className="text-2xl mb-1">🕳️</div>
          <div className="text-xs text-gray-400">Crater</div>
          <div className="text-lg font-bold text-yellow-400">{data.craterDiameter}</div>
        </div>
        
        <div className="space-panel-dark p-3 text-center">
          <div className="text-2xl mb-1">💨</div>
          <div className="text-xs text-gray-400">Blast Zone</div>
          <div className="text-lg font-bold text-orange-400">{data.blastRadius}</div>
        </div>
        
        <div className="space-panel-dark p-3 text-center">
          <div className="text-2xl mb-1">🔥</div>
          <div className="text-xs text-gray-400">Thermal</div>
          <div className="text-lg font-bold text-red-400">{data.thermalRadius}</div>
        </div>
      </div>
      
      {/* Population Impact */}
      <div className="space-panel-dark p-4 border-l-4 border-red-500">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">👥</span>
          <span className="font-semibold text-red-300">Population at Risk</span>
        </div>
        <div className="text-3xl font-bold text-red-400">
          {data.populationAffected}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Within primary blast zone
        </div>
      </div>
      
      {/* Detailed breakdown */}
      <div className="space-panel-dark p-4">
        <div className="text-sm font-medium text-blue-300 mb-3">Effect Zones</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-white/10">
            <span className="text-gray-400">💥 Total destruction</span>
            <span className="text-red-400 font-mono">{data.details?.totalDestruction || '0.0 km'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-white/10">
            <span className="text-gray-400">🏢 Heavy damage</span>
            <span className="text-orange-400 font-mono">{data.blastRadius}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-white/10">
            <span className="text-gray-400">🔥 3rd degree burns</span>
            <span className="text-yellow-400 font-mono">{data.thermalRadius}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-400">💨 Window breakage</span>
            <span className="text-blue-400 font-mono">{data.details?.windowBreakage || '0.0 km'}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const MitigationPanel = ({ simulationData, onMitigationComplete, onError }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
        Planetary Defense
      </h3>
      <p className="text-sm text-gray-400 mt-1">Deflection & mitigation options</p>
    </div>
    
    <div className="space-y-4">
      {!simulationData ? (
        <div className="space-panel-dark p-6 text-center">
          <div className="text-4xl mb-3">🛡️</div>
          <p className="text-gray-400 mb-4">Run an impact simulation first to analyze mitigation options</p>
          <button className="btn-primary text-sm" disabled>
            Requires Simulation Data
          </button>
        </div>
      ) : (
        <>
          {/* Deflection Methods */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-green-300">Available Deflection Methods</div>
            
            <div className="space-panel-dark p-4 hover:border-green-500/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🚀</span>
                <span className="font-semibold text-green-300">Kinetic Impactor</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                High-velocity spacecraft collision to alter trajectory
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-blue-300">Success Rate: 85%</span>
                <span className="text-yellow-300">Lead Time: 5-10 years</span>
              </div>
            </div>
            
            <div className="space-panel-dark p-4 hover:border-blue-500/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🛰️</span>
                <span className="font-semibold text-blue-300">Gravity Tractor</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Spacecraft uses gravitational pull for precise deflection
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-blue-300">Success Rate: 95%</span>
                <span className="text-yellow-300">Lead Time: 10-15 years</span>
              </div>
            </div>
            
            <div className="space-panel-dark p-4 hover:border-purple-500/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💥</span>
                <span className="font-semibold text-purple-300">Nuclear Standoff</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Nuclear explosion near surface for emergency deflection
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-blue-300">Success Rate: 70%</span>
                <span className="text-yellow-300">Lead Time: 1-5 years</span>
              </div>
            </div>
          </div>
          
          {/* Mission Planning */}
          <div className="space-panel-dark p-4 border-l-4 border-green-500">
            <div className="text-green-300 font-medium mb-2">🎯 Recommended Strategy</div>
            <div className="text-sm text-white mb-2">
              Based on asteroid size and warning time: <span className="font-bold text-green-400">Kinetic Impactor Mission</span>
            </div>
            <div className="text-xs text-gray-400">
              Estimated deflection: 0.003° trajectory change<br/>
              Mission cost: $2.5B USD | Timeline: 8 years
            </div>
          </div>
          
          <button 
            className="btn-primary w-full"
            onClick={() => {
              onMitigationComplete({
                method: "kinetic_impactor",
                success_probability: 0.85,
                deflection_angle: 0.003,
                mission_duration: 8
              })
            }}
          >
            🚀 Plan Deflection Mission
          </button>
        </>
      )}
    </div>
  </div>
)

const LoadingSpinner = () => (
  <div className="relative">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-warning border-opacity-75"></div>
    <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-warning opacity-30"></div>
    <div className="absolute inset-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
  </div>
)

const InfoTooltip = ({ content, children }) => (
  <div title={content}>{children}</div>
)

function App() {
  const [activeTab, setActiveTab] = useState('simulation')
  const [mitigationData, setMitigationData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const activeLocation = useSimulationFlow((state) => state.activeLocation)
  const targetLocation = useSimulationFlow((state) => state.targetLocation)
  const simulationData = useSimulationFlow((state) => state.simulationResult)
  const setSimulationResult = useSimulationFlow((state) => state.setSimulationResult)
  const phase = useSimulationFlow((state) => state.phase)

  const selectedLocation = activeLocation ?? targetLocation

  const handleSimulationComplete = useCallback((data) => {
    setSimulationResult(data)
    setError(null)
    setIsLoading(false)
    setMitigationData(null)
  }, [setSimulationResult])

  const handleMitigationComplete = useCallback((data) => {
    setMitigationData(data)
  }, [])

  const handleError = useCallback((error) => {
    setError(error.message || 'An error occurred')
    setIsLoading(false)
  }, [])

  const handleViewportLocationSelect = useCallback(() => {
    setError(null)
    setMitigationData(null)
    setActiveTab('simulation')
  }, [])

  React.useEffect(() => {
    if (!selectedLocation) {
      setMitigationData(null)
    }
  }, [selectedLocation])

  React.useEffect(() => {
    if (phase === PHASES.SPACE_IDLE) {
      setIsLoading(false)
      setError(null)
      setMitigationData(null)
    }
  }, [phase])

  return (
    <div className="min-h-screen bg-space-gradient overflow-hidden">
      {/* Header */}
      <header className="space-panel border-b-0 rounded-none shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <AlertTriangle className="h-10 w-10 text-warning animate-pulse-slow glow-warning" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-wider text-white">
                  <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-orange-600 bg-clip-text text-transparent">
                    IMPACTOR
                  </span>
                  <span className="text-blue-400">-2025</span>
                </h1>
                <p className="text-sm text-gray-300 font-medium tracking-wide">
                  🛡️ Planetary Defense System • 🌍 Earth Impact Simulator
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-400">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>SYSTEM ONLINE</span>
              </div>
              
              <InfoTooltip content="NASA Space Apps Challenge 2024 - Interactive tool for asteroid impact assessment and planetary defense planning">
                <Info className="h-6 w-6 text-blue-400 hover:text-warning transition-colors cursor-help glow-warning" />
              </InfoTooltip>
              
              <a 
                href="https://github.com/your-team/impactor-2025" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
              >
                <Github className="h-6 w-6" />
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-88px)]">
        
        {/* Left Panel - Controls */}
        <div className="lg:w-96 space-panel-dark border-r-2 border-white/20 overflow-y-auto scrollbar-space">
          
          {/* Tab Navigation */}
          <div className="border-b border-white/20 bg-black/30">
            <div className="flex">
              <button
                className={`flex-1 px-4 py-4 text-sm font-bold transition-all duration-300 ${
                  activeTab === 'simulation' 
                    ? 'tab-active transform scale-105' 
                    : 'tab-inactive'
                }`}
                onClick={() => setActiveTab('simulation')}
              >
                <Zap className="inline h-5 w-5 mr-2" />
                <span className="hidden sm:inline">IMPACT</span> SIMULATION
              </button>
              <button
                className={`flex-1 px-4 py-4 text-sm font-bold transition-all duration-300 ${
                  activeTab === 'mitigation' 
                    ? 'tab-active transform scale-105' 
                    : 'tab-inactive'
                }`}
                onClick={() => setActiveTab('mitigation')}
              >
                <Shield className="inline h-5 w-5 mr-2" />
                <span className="hidden sm:inline">DEFENSE</span> SYSTEMS
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'simulation' && (
              <div className="space-y-8">
                <ParameterPanel
                  selectedLocation={selectedLocation}
                  onSimulationStart={() => setIsLoading(true)}
                  onSimulationComplete={handleSimulationComplete}
                  onError={handleError}
                />
                
                {isLoading && (
                  <div className="flex flex-col items-center py-8 space-y-4">
                    <LoadingSpinner />
                    <div className="text-center">
                      <div className="text-warning font-bold animate-pulse">CALCULATING IMPACT...</div>
                      <div className="text-xs text-gray-400 mt-1">Analyzing trajectory and effects</div>
                    </div>
                  </div>
                )}
                
                {simulationData && (
                  <div className="animate-fade-in">
                    <ResultsPanel data={simulationData} />
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'mitigation' && (
              <div className="animate-fade-in">
                <MitigationPanel
                  simulationData={simulationData}
                  onMitigationComplete={handleMitigationComplete}
                  onError={handleError}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 relative">
          <CinematicViewport
            simulationData={simulationData}
            mitigationData={mitigationData}
            onLocationSelect={handleViewportLocationSelect}
          />
          
          {error && (
            <div className="absolute top-6 left-6 right-6 bg-red-600/95 backdrop-blur-lg text-white px-6 py-4 rounded-xl border border-red-400/50 shadow-2xl z-50 animate-pulse">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 mr-3 flex-shrink-0 text-yellow-300 animate-bounce" />
                <div className="flex-1">
                  <div className="font-bold text-red-100">SYSTEM ERROR</div>
                  <div className="text-sm text-red-200">{error}</div>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="ml-4 text-red-200 hover:text-white text-xl font-bold hover:scale-110 transition-transform"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="space-panel-dark border-t-2 border-white/20 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span className="font-mono">© 2025 Impactor-2025</span>
              <span className="text-blue-400">•</span>
              <span className="font-medium text-blue-300">🚀 NASA Space Apps Challenge</span>
            </div>
            
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              <InfoTooltip content="Physics simplified for rapid prototyping. Not for operational use.">
                <span className="cursor-help bg-red-500/20 px-2 py-1 rounded border border-red-500/50 animate-pulse">
                  ⚠️ DEMO MODE
                </span>
              </InfoTooltip>
              <span className="text-blue-400">•</span>
              <span className="font-mono">Data: NASA CNEOS • USGS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Wrapped App with Error Boundary
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)

export default AppWithErrorBoundary