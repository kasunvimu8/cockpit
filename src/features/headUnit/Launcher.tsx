import { LAUNCHER_APPS } from '../../data/launcherApps'
import { useSettingsStore } from '../../store/settingsStore'
import { TempControl } from './TempControl'

const ACCENT_CLASSES: Record<string, string> = {
  phone: 'text-[#3fb75e]',
  music: 'text-[#1fce5f]',
  calendar: 'text-[#e05252]'
}

const APP_BASE_CLASSES =
  'flex h-[25px] w-[25px] cursor-pointer items-center justify-center rounded-[7px] border-none bg-transparent text-[13px] transition-colors hover:bg-launcher-hover'

/** Bottom app launcher bar with climate controls on both sides. */
export function Launcher() {
  const openPanel = useSettingsStore((state) => state.openPanel)

  return (
    <div className="z-[8] flex h-[42px] flex-none items-center gap-2 border-t border-launcher-line bg-launcher-bg px-4">
      <span className="text-base text-launcher-text">🚘</span>
      <TempControl side="left" />
      <div className="flex flex-1 items-center justify-center gap-5">
        {LAUNCHER_APPS.map((app) => (
          <button
            key={app.id}
            type="button"
            title={app.label}
            className={`${APP_BASE_CLASSES} ${app.accent ? ACCENT_CLASSES[app.accent] : 'text-launcher-text'}`}
            onClick={app.action === 'openSettings' ? openPanel : undefined}
          >
            {app.icon}
          </button>
        ))}
      </div>
      <TempControl side="right" />
      <span className="text-base text-launcher-text">🔊</span>
    </div>
  )
}
