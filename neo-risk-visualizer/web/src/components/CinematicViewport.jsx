import React from 'react'
import SmoothPlanetScene from './SmoothPlanetScene'
import useSimulationFlow, { PHASES } from '../store/useSimulationFlow'

function DamageSummary({ simulationData }) {
  if (!simulationData) {
    return (
      <div className="bg-slate-900/75 border border-slate-700/80 rounded-2xl p-6 text-slate-200 shadow-2xl">
        <h3 className="text-sm uppercase tracking-widest text-sky-300">Awaiting Simulation</h3>
        <p className="text-xs text-slate-300 mt-2">
          Configure asteroid parameters and run the simulation to render damage envelopes on the target region.
        </p>
      </div>
    )
  }

  const { energy, craterDiameter, blastRadius, thermalRadius, populationAffected, details, textureEffects } = simulationData

  const metrics = [
    { label: 'Impact Energy', value: energy, accent: 'text-amber-300' },
    { label: 'Crater Diameter', value: craterDiameter, accent: 'text-orange-300' },
    { label: 'Blast Radius', value: blastRadius, accent: 'text-red-300' },
    { label: 'Thermal Radius', value: thermalRadius, accent: 'text-rose-300' }
  ]

  return (
    <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-lg">
      <h3 className="text-xs uppercase tracking-widest text-sky-300">Damage Footprint</h3>
      <p className="text-lg font-semibold text-white mt-1">Population at Risk: <span className="text-rose-300">{populationAffected}</span></p>
      <div className="grid grid-cols-2 gap-3 mt-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-black/30 border border-white/10 rounded-2xl px-4 py-3">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-400">{metric.label}</p>
            <p className={`text-lg font-semibold ${metric.accent}`}>{metric.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 text-xs text-slate-300 space-y-1">
        <p>Heavy Damage: <span className="text-red-300 font-semibold">{details?.heavyDamage ?? blastRadius}</span></p>
        <p>3rd Degree Burns: <span className="text-orange-300 font-semibold">{details?.thermalBurns ?? thermalRadius}</span></p>
        <p>Window Breakage: <span className="text-sky-300 font-semibold">{details?.windowBreakage ?? 'n/a'}</span></p>
      </div>
      
      {/* Texture Damage Section */}
      {textureEffects && textureEffects.length > 0 && (
        <div className="mt-6 border-t border-slate-700/50 pt-4">
          <h4 className="text-xs uppercase tracking-widest text-sky-300 mb-3">Material Damage & Consequences</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {textureEffects.slice(0, 4).map((effect, index) => (
              <div key={effect.material_type} className="bg-black/20 border border-white/5 rounded-xl px-3 py-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-white capitalize">{effect.material_type}</span>
                  <span className="text-xs text-cyan-300">{Math.round(effect.damage_percentage || 0)}% damaged</span>
                </div>
                <p className="text-[0.6rem] text-slate-400 mt-1 leading-tight">
                  {effect.consequences.slice(0, 80)}...
                </p>
              </div>
            ))}
          </div>
          {textureEffects.length > 4 && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              +{textureEffects.length - 4} more materials affected
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function SimulationControls({ activeLocation, onRunSimulation, isLoading, onBackToGlobe }) {
  const [parameters, setParameters] = React.useState({
    diameter: 100,
    velocity: 20,
    angle: 45,
    density: 2500
  })

  const handleSimulate = () => {
    if (!activeLocation) return
    onRunSimulation({
      lat: activeLocation.latitude,
      lon: activeLocation.longitude,
      diameter_m: parameters.diameter,
      density_kg_m3: parameters.density,
      velocity_km_s: parameters.velocity,
      angle_deg: parameters.angle
    })
  }

  return (
    <div className="pointer-events-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-6 backdrop-blur-xl shadow-2xl max-w-sm animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">☄️</span>
        <h3 className="text-sm uppercase tracking-widest text-sky-300">Impact Parameters</h3>
      </div>
      
      <div className="text-xs text-slate-400 mb-4 bg-slate-800/50 rounded-lg p-3">
        Target: <span className="text-white font-semibold">{activeLocation?.name}</span><br/>
        Coordinates: <span className="text-cyan-300">{activeLocation?.latitude?.toFixed(2)}°, {activeLocation?.longitude?.toFixed(2)}°</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs text-slate-300">Asteroid Diameter</label>
            <span className="text-xs text-orange-300 font-semibold">{parameters.diameter}m</span>
          </div>
          <input
            type="range"
            min="10"
            max="1000"
            step="5"
            value={parameters.diameter}
            onChange={(e) => setParameters(prev => ({ ...prev, diameter: parseInt(e.target.value) }))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="text-[0.6rem] text-slate-500 mt-1">City-killer: 140m+ • Regional: 300m+ • Global: 1km+</div>
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs text-slate-300">Impact Velocity</label>
            <span className="text-xs text-red-300 font-semibold">{parameters.velocity} km/s</span>
          </div>
          <input
            type="range"
            min="11"
            max="50"
            value={parameters.velocity}
            onChange={(e) => setParameters(prev => ({ ...prev, velocity: parseInt(e.target.value) }))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="text-[0.6rem] text-slate-500 mt-1">Typical range: 15-25 km/s</div>
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs text-slate-300">Impact Angle</label>
            <span className="text-xs text-yellow-300 font-semibold">{parameters.angle}°</span>
          </div>
          <input
            type="range"
            min="15"
            max="90"
            value={parameters.angle}
            onChange={(e) => setParameters(prev => ({ ...prev, angle: parseInt(e.target.value) }))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="text-[0.6rem] text-slate-500 mt-1">Most likely: 45° • Steeper = more damage</div>
        </div>
      </div>
      
      <div className="space-y-3 mt-6">
        <button
          onClick={handleSimulate}
          disabled={isLoading || !activeLocation}
          className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              Calculating...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>🔥</span>
              Simulate Impact
            </div>
          )}
        </button>
        
        <button
          onClick={onBackToGlobe}
          className="w-full bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 hover:text-white font-medium py-2.5 rounded-lg transition-all duration-300 border border-slate-600/50 hover:border-slate-500"
        >
          <div className="flex items-center justify-center gap-2">
            <span>🌍</span>
            Choose Different City
          </div>
        </button>
      </div>
      
      <div className="mt-4 text-[0.6rem] text-slate-500 text-center">
        Physics based on Earth Impact Effects Program
      </div>
    </div>
  )
}

function SurfaceOverlay({ activeLocation, simulationData, onRunSimulation, isLoading, onBackToGlobe }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex">
      <div className="relative flex-1">
        <div className="absolute inset-6 rounded-[3rem] bg-gradient-to-br from-emerald-500/10 via-transparent to-red-500/20 border border-white/10 backdrop-blur-sm">
          <div className="absolute inset-0 mix-blend-screen opacity-40 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.4)_0%,_rgba(15,23,42,0)_70%)]" />
          <div className="absolute inset-10 border border-white/10 rounded-[2.5rem]" />
          <div className="absolute inset-20 border border-red-400/40 rounded-[2rem]" />
          <div className="absolute inset-28 border border-amber-400/40 rounded-[1.5rem]" />
          <div className="absolute inset-36 border border-sky-400/40 rounded-[1rem]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-2xl">📍</div>
            <p className="text-xs uppercase tracking-widest text-white/70">{activeLocation?.name ?? 'Target Area'}</p>
            {simulationData && (
              <p className="text-[0.6rem] text-white/60 mt-1">
                Blast edge ≈ {simulationData.blastRadius}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Right side - Controls or Results */}
      <div className="w-[320px] pr-10 mt-10 space-y-4">
        {!simulationData ? (
          <SimulationControls 
            activeLocation={activeLocation} 
            onRunSimulation={onRunSimulation}
            isLoading={isLoading}
            onBackToGlobe={onBackToGlobe}
          />
        ) : (
          <DamageSummary simulationData={simulationData} />
        )}
      </div>
    </div>
  )
}

function MitigationBadge({ mitigationData }) {
  if (!mitigationData) return null

  return (
    <div className="pointer-events-auto bg-slate-900/80 border border-emerald-500/60 rounded-2xl px-5 py-4 shadow-xl backdrop-blur">
      <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">Defense Mission</p>
      <p className="text-sm text-white font-semibold mt-2 flex items-center gap-2">
        <span className="text-lg">🚀</span>
        {mitigationData.method?.replace('_', ' ') ?? 'Kinetic Impactor'}
      </p>
      <div className="mt-3 text-[0.7rem] text-slate-200 space-y-1">
        <p>Success Probability: <span className="text-emerald-300 font-semibold">{Math.round((mitigationData.success_probability ?? 0) * 100)}%</span></p>
        <p>Lead Time: <span className="text-emerald-200 font-semibold">{mitigationData.mission_duration ?? mitigationData.lead_time_years ?? 0} years</span></p>
      </div>
    </div>
  )
}

function CinematicViewport({ simulationData, mitigationData, onLocationSelect, onRunSimulation, isLoading }) {
  const { phase, activeLocation, targetLocation, resetFlow } = useSimulationFlow((state) => ({
    phase: state.phase,
    activeLocation: state.activeLocation,
    targetLocation: state.targetLocation,
    resetFlow: state.resetFlow
  }))

  const showSurface = phase === PHASES.SURFACE_ANALYSIS

  // Debug logging
  React.useEffect(() => {
    console.log('CinematicViewport - Current phase:', phase, 'Active location:', activeLocation?.name, 'Target location:', targetLocation?.name)
  }, [phase, activeLocation, targetLocation])

  return (
    <div className="relative h-full w-full">
      <SmoothPlanetScene onLocationSelect={onLocationSelect} />

      {showSurface && (
        <SurfaceOverlay 
          activeLocation={activeLocation} 
          simulationData={simulationData}
          onRunSimulation={onRunSimulation}
          isLoading={isLoading}
          onBackToGlobe={resetFlow}
        />
      )}

      {/* Always visible navigation */}
      <div className="absolute top-6 left-6 z-50">
        {showSurface ? (
          // Surface mode breadcrumb
          <div className="pointer-events-none">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3 shadow-xl">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Earth button clicked, calling resetFlow')
                  resetFlow()
                }}
                className="pointer-events-auto text-sky-300 hover:text-white transition-all duration-200 text-sm font-medium flex items-center gap-1.5 hover:scale-110 transform bg-sky-500/20 hover:bg-sky-400/30 px-2 py-1 rounded-lg border border-sky-400/30 hover:border-sky-300/50"
              >
                <span>🌍</span>
                <span>Earth</span>
              </button>
              
              <span className="text-slate-500 text-sm">›</span>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-orange-400">📍</span>
                <span className="text-white font-medium">{activeLocation?.name || 'Target Location'}</span>
              </div>
              
              {simulationData && (
                <>
                  <span className="text-slate-500 text-sm">›</span>
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-red-400">💥</span>
                    <span className="text-white font-medium">Impact Results</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          // Globe mode info
          <div className="bg-black/60 backdrop-blur border border-white/20 rounded-lg px-3 py-2 text-xs text-white">
            <div className="flex items-center gap-2">
              <span>🌍</span>
              <span>Select a city to begin impact analysis</span>
            </div>
          </div>
        )}
      </div>

      {/* Always visible back button when not in globe mode */}
      {(activeLocation || targetLocation || showSurface) && (
        <div className="absolute top-6 right-6 z-50">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Back to Globe button clicked, current phase:', phase, 'activeLocation:', activeLocation, 'targetLocation:', targetLocation)
              resetFlow()
            }}
            className="pointer-events-auto bg-slate-900/90 hover:bg-slate-800/90 border border-slate-600/80 hover:border-slate-500 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 shadow-lg backdrop-blur-lg flex items-center gap-2 hover:scale-105"
          >
            <span className="text-lg">←</span>
            <span>Back to Globe</span>
          </button>
        </div>
      )}

      {/* Secondary controls */}
      <div className="absolute bottom-6 right-6 flex gap-3">
        {showSurface && (
          <div className="pointer-events-auto bg-black/40 backdrop-blur border border-white/20 rounded-lg px-3 py-2 text-xs text-white">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Surface Analysis Mode</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button - Always visible when not in idle mode */}
      {phase !== PHASES.SPACE_IDLE && (
        <div className="absolute bottom-6 right-20 z-50">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('FAB clicked - Reset to globe view')
              resetFlow()
            }}
            className="pointer-events-auto w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center border-2 border-blue-400/50 hover:border-blue-300"
            title="Back to Globe View"
          >
            <span className="text-xl">🌍</span>
          </button>
        </div>
      )}

      <div className="absolute bottom-6 left-6">
        <MitigationBadge mitigationData={mitigationData} />
      </div>
    </div>
  )
}

export default CinematicViewport
