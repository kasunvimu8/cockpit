import { formatDurationMin, formatRouteLengthKm } from '../../shared/lib/format'
import { RouteIndex } from '../../shared/lib/routeIndex'
import { useNavigationStore } from '../../store/navigationStore'
import { useSimulationStore } from '../../store/simulationStore'
import { useMapAdapter } from '../map/MapContext'
import { driveSimulator } from '../simulation/DriveSimulator'

/** Journey overview card shown after picking a destination: start or cancel guidance. */
export function RoutePreviewCard() {
  const adapter = useMapAdapter()
  const phase = useNavigationStore((state) => state.phase)
  const destination = useNavigationStore((state) => state.destination)
  const routeCoordinates = useNavigationStore((state) => state.routeCoordinates)
  const routeLengthM = useNavigationStore((state) => state.routeLengthM)
  const startNavigation = useNavigationStore((state) => state.startNavigation)
  const endNavigation = useNavigationStore((state) => state.endNavigation)
  const speedKmh = useSimulationStore((state) => state.speedKmh)

  if (phase !== 'preview' || !destination || !routeCoordinates) return null

  const etaLabel = formatDurationMin(routeLengthM / (speedKmh / 3.6) / 60)

  const onStart = () => {
    driveSimulator.setRoute(new RouteIndex(routeCoordinates), { loop: false })
    adapter?.beginFollowTransition()
    startNavigation()
    useSimulationStore.getState().setFreeLook(false)
    useSimulationStore.getState().setPlaying(true)
  }

  return (
    <div className="absolute bottom-3 left-1/2 z-6 flex -translate-x-1/2 items-center gap-3.5 rounded-[14px] border border-line bg-surface py-2.5 pl-4 pr-3 shadow-[0_10px_30px_#00000026]">
      <div className="flex min-w-[120px] max-w-[260px] flex-col gap-px">
        <b className="overflow-hidden text-ellipsis whitespace-nowrap text-base font-extrabold text-nav-green">
          {etaLabel}
        </b>
        <span className="text-[11px] text-muted">
          {formatRouteLengthKm(routeLengthM)} · {destination.name}
        </span>
      </div>
      <button
        type="button"
        className="cursor-pointer rounded-full border-none bg-accent px-6 py-[9px] font-sans text-[12.5px] font-semibold text-white transition-[filter] hover:brightness-105"
        onClick={onStart}
      >
        Start
      </button>
      <button
        type="button"
        className="cursor-pointer rounded-[9px] border border-line bg-transparent px-4 py-[9px] font-sans text-[12.5px] font-semibold text-muted transition-[filter] hover:brightness-105"
        onClick={endNavigation}
      >
        Cancel
      </button>
    </div>
  )
}
