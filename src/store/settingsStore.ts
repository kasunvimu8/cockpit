import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface SettingsState {
  theme: Theme
  panelOpen: boolean
  setTheme: (theme: Theme) => void
  openPanel: () => void
  closePanel: () => void
}

/** User-facing platform settings; theme is persisted across sessions. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      panelOpen: false,
      setTheme: (theme) => set({ theme }),
      openPanel: () => set({ panelOpen: true }),
      closePanel: () => set({ panelOpen: false })
    }),
    {
      name: 'cockpit-settings',
      partialize: (state) => ({ theme: state.theme })
    }
  )
)
