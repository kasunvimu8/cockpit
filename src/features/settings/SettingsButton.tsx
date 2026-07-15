import { useSettingsStore } from '../../store/settingsStore'

/** Floating menu button in the top-right corner of the map that opens the settings dialog. */
export function SettingsButton() {
  const openPanel = useSettingsStore((state) => state.openPanel)
  return (
    <button
      type="button"
      className="absolute right-3 top-3 z-6 flex h-10.5 w-10.5 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface text-text shadow-[0_6px_20px_#0000001a] transition-colors hover:bg-hover"
      aria-label="Open settings"
      onClick={openPanel}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          d="M2 4.5h14M2 9h14M2 13.5h14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
