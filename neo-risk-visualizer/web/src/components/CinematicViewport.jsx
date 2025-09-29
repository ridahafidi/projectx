import React from 'react'
import SpaceScene from './SpaceScene'
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

function SurfaceOverlay({ activeLocation, simulationData }) {
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
      <div className="w-[320px] pr-10 mt-10">
        <DamageSummary simulationData={simulationData} />
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

function CinematicViewport({ simulationData, mitigationData, onLocationSelect }) {
  const { phase, activeLocation, resetFlow } = useSimulationFlow((state) => ({
    phase: state.phase,
    activeLocation: state.activeLocation,
    resetFlow: state.resetFlow
  }))

  const showSurface = phase === PHASES.SURFACE_ANALYSIS

  return (
    <div className="relative h-full w-full">
      <SpaceScene onLocationSelect={onLocationSelect} />

      {showSurface && (
        <SurfaceOverlay activeLocation={activeLocation} simulationData={simulationData} />
      )}

      <div className="absolute bottom-6 right-6 flex gap-3">
        {showSurface && (
          <button
            onClick={resetFlow}
            className="bg-slate-900/80 border border-slate-600 px-5 py-2 rounded-full text-xs font-semibold tracking-[0.2em] text-white hover:bg-slate-800 transition pointer-events-auto"
          >
            RETRY
          </button>
        )}
      </div>

      <div className="absolute bottom-6 left-6">
        <MitigationBadge mitigationData={mitigationData} />
      </div>
    </div>
  )
}

export default CinematicViewport
