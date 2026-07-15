import { useNavigationStore } from '../../store/navigationStore'
import { useSimulationStore, ZOOM_STEP } from '../../store/simulationStore'
import { useMapAdapter } from './MapContext'

const BUTTON_CLASSES =
  'h-9 w-[38px] cursor-pointer border-none bg-transparent text-[17px] text-text transition-colors hover:bg-hover'

export function ZoomControls() {
  const adapter = useMapAdapter()
  const adjustZoom = useSimulationStore((state) => state.adjustZoom)
  const freeLook = useSimulationStore((state) => state.freeLook)
  const phase = useNavigationStore((state) => state.phase)

  // when the follow camera is suspended (overview or user pan), zoom the map directly
  const onZoom = (delta: number) => {
    if (phase === 'preview' || freeLook) adapter?.nudgeZoom(delta)
    else adjustZoom(delta)
  }

  return (
    <div className="absolute bottom-3 right-3 z-5 flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[0_6px_20px_#0000001a]">
      <button
        type="button"
        aria-label="Zoom in"
        className={`${BUTTON_CLASSES} border-b border-line`}
        onClick={() => onZoom(ZOOM_STEP)}
      >
        ＋
      </button>
      <button
        type="button"
        aria-label="Zoom out"
        className={BUTTON_CLASSES}
        onClick={() => onZoom(-ZOOM_STEP)}
      >
        －
      </button>
    </div>
  )
}
