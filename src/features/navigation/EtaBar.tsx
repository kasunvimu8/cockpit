import { formatClock, formatDistanceM, formatDurationMin } from '../../shared/lib/format'
import { useNavigationStore } from '../../store/navigationStore'
import { useSimulationStore } from '../../store/simulationStore'
import { useToastStore } from '../../store/toastStore'

/**
 * Google-Maps-style trip bar while navigating: time, distance and arrival, with
 * pause/resume and end-trip controls.
 */
export function EtaBar() {
  const phase = useNavigationStore((state) => state.phase)
  const remainingM = useNavigationStore((state) => state.remainingM)
  const endNavigation = useNavigationStore((state) => state.endNavigation)
  const playing = useSimulationStore((state) => state.playing)
  const setPlaying = useSimulationStore((state) => state.setPlaying)
  const speedKmh = useSimulationStore((state) => state.speedKmh)

  if (phase !== 'navigating') return null

  const remainingMinutes = Math.max(1, Math.round(remainingM / (speedKmh / 3.6) / 60))
  const arrival = formatClock(new Date(Date.now() + remainingMinutes * 60000))
  const remainingLabel = formatDurationMin(remainingMinutes)

  const onEndTrip = () => {
    endNavigation()
    useSimulationStore.getState().setPlaying(false)
    useToastStore.getState().show('Trip ended')
  }

  return (
    <div className="absolute bottom-3 left-1/2 z-6 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-btn-border bg-surface py-2 pl-4.5 pr-2 shadow-[0_10px_30px_#00000026] backdrop-blur-sm">
      <span className="whitespace-nowrap text-base font-extrabold text-nav-green">
        {remainingLabel}
      </span>
      <span className="whitespace-nowrap text-xs text-muted">
        {formatDistanceM(remainingM)} · {arrival}
      </span>
      <button
        type="button"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line bg-transparent text-[11px] text-text transition-colors hover:bg-hover"
        aria-label={playing ? 'Pause trip' : 'Resume trip'}
        onClick={() => setPlaying(!playing)}
      >
        {playing ? '❚❚' : '▶'}
      </button>
      <button
        type="button"
        className="h-9 w-9 cursor-pointer rounded-full border-none bg-red text-sm text-white transition-[filter] hover:brightness-110"
        aria-label="End trip"
        onClick={onEndTrip}
      >
        ✕
      </button>
    </div>
  )
}
