import { useSimulationStore } from '../../store/simulationStore'

/** Current vehicle speed readout — 0 while paused. */
export function SpeedChip() {
  const playing = useSimulationStore((state) => state.playing)
  const speedKmh = useSimulationStore((state) => state.speedKmh)

  return (
    <div className="absolute bottom-3 left-3 z-5 rounded-[14px] border border-btn-border bg-surface px-4 py-2 text-center shadow-[0_6px_20px_#0000001a] backdrop-blur-sm">
      <div className="font-mono text-3xl font-semibold leading-none text-text">
        {playing ? speedKmh : 0}
      </div>
      <div className="text-[9px] uppercase tracking-[0.12em] text-muted">km/h</div>
    </div>
  )
}
