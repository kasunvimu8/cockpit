import { LayersIcon, LocateIcon, SearchIcon } from '../../shared/components/icons'
import { useNavigationStore } from '../../store/navigationStore'
import { useSearchUIStore } from '../../store/searchUIStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useSimulationStore } from '../../store/simulationStore'
import { useMapAdapter } from './MapContext'

const BUTTON_CLASSES =
  'flex h-[calc(var(--hu)*43.6px)] w-[calc(var(--hu)*43.6px)] flex-none cursor-pointer items-center justify-center rounded-full border border-btn-border bg-btn-bg text-text shadow-[0_6px_20px_#0000001a] backdrop-blur-sm transition-colors hover:bg-active-bg'

const ICON_CLASSES = 'h-[calc(var(--hu)*18px)] w-[calc(var(--hu)*18px)]'

/** Vertical stack of the primary map actions: settings, recenter and destination search. */
export function FloatingControls() {
  const adapter = useMapAdapter()
  const openPanel = useSettingsStore((state) => state.openPanel)
  const freeLook = useSimulationStore((state) => state.freeLook)
  const setFreeLook = useSimulationStore((state) => state.setFreeLook)
  const phase = useNavigationStore((state) => state.phase)
  const toggleSearch = useSearchUIStore((state) => state.toggle)

  const canRecenter = freeLook && phase !== 'preview'

  const onRecenter = () => {
    if (!canRecenter) return
    adapter?.beginFollowTransition()
    setFreeLook(false)
  }

  return (
    <div className="absolute left-[calc(var(--hu)*26px)] top-[calc(var(--hu)*72px)] z-8 flex flex-col gap-[calc(var(--hu)*7px)]">
      <button
        type="button"
        className={BUTTON_CLASSES}
        aria-label="Open settings"
        onClick={openPanel}
      >
        <LayersIcon className={ICON_CLASSES} />
      </button>
      <button
        type="button"
        className={BUTTON_CLASSES}
        aria-label="Recenter map"
        aria-disabled={!canRecenter}
        onClick={onRecenter}
      >
        <LocateIcon className={ICON_CLASSES} />
      </button>
      <button
        type="button"
        className={BUTTON_CLASSES}
        aria-label="Search destination"
        onClick={toggleSearch}
      >
        <SearchIcon className={ICON_CLASSES} />
      </button>
    </div>
  )
}
