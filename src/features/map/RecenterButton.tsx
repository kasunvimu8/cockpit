import { useNavigationStore } from '../../store/navigationStore'
import { useSimulationStore } from '../../store/simulationStore'
import { useMapAdapter } from './MapContext'

/** Returns the camera to the vehicle after a manual pan, like Google's re-centre chip. */
export function RecenterButton() {
  const adapter = useMapAdapter()
  const freeLook = useSimulationStore((state) => state.freeLook)
  const setFreeLook = useSimulationStore((state) => state.setFreeLook)
  const phase = useNavigationStore((state) => state.phase)

  // in preview the overview owns the camera; re-centring only applies to follow modes
  if (!freeLook || phase === 'preview') return null

  const onRecenter = () => {
    adapter?.beginFollowTransition()
    setFreeLook(false)
  }

  return (
    <button
      type="button"
      className={`absolute left-1/2 z-6 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-[12.5px] font-semibold text-accent shadow-[0_8px_24px_#00000026] transition-colors hover:bg-hover ${phase === 'navigating' ? 'bottom-18' : 'bottom-3'}`}
      onClick={onRecenter}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2 L19 21 L12 16.5 L5 21 Z" fill="currentColor" />
      </svg>
      Re-center
    </button>
  )
}
