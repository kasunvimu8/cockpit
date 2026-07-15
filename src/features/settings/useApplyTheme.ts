import { useEffect } from 'react'
import { useSettingsStore } from '../../store/settingsStore'

/** Mirrors the configured theme onto the document root for the CSS token overrides. */
export function useApplyTheme(): void {
  const theme = useSettingsStore((state) => state.theme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
}
