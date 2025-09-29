import { create } from 'zustand'

const PHASES = {
  SPACE_IDLE: 'space-idle',
  ALIGNING: 'aligning',
  TRANSITION_TO_SURFACE: 'transition-to-surface',
  SURFACE_ANALYSIS: 'surface-analysis',
  RESETTING: 'resetting'
}

export { PHASES }

const useSimulationFlow = create((set, get) => ({
  phase: PHASES.SPACE_IDLE,
  targetLocation: null,
  activeLocation: null,
  simulationResult: null,
  setPhase: (phase) => set({ phase }),
  selectLocation: (location) => {
    const currentPhase = get().phase
    const nextPhase = currentPhase === PHASES.SURFACE_ANALYSIS ? PHASES.TRANSITION_TO_SURFACE : PHASES.ALIGNING
    set({ targetLocation: location, phase: nextPhase, simulationResult: null })
  },
  confirmAlignment: () => {
    const { targetLocation } = get()
    if (!targetLocation) return
    set({ activeLocation: targetLocation, phase: PHASES.TRANSITION_TO_SURFACE })
  },
  enterSurfaceView: () => set({ phase: PHASES.SURFACE_ANALYSIS }),
  setSimulationResult: (result) => set({ simulationResult: result }),
  resetFlow: () => set({ phase: PHASES.RESETTING }),
  completeReset: () => set({
    phase: PHASES.SPACE_IDLE,
    targetLocation: null,
    activeLocation: null,
    simulationResult: null
  })
}))

export default useSimulationFlow
