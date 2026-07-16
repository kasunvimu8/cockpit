import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OfferAdFormat } from '../services/offers/offersClient'
import { OFFERS_MAX_RADIUS_M, OFFERS_MIN_RADIUS_M } from '../services/offers/offersClient'

export type Theme = 'light' | 'dark'

interface SettingsState {
  theme: Theme
  panelOpen: boolean
  /** Search radius for nearby ad offers, clamped to the service limits. */
  offersRadiusM: number
  /** Ad formats requested from the offers service and shown in the head unit. */
  offersAdFormats: OfferAdFormat[]
  setTheme: (theme: Theme) => void
  openPanel: () => void
  closePanel: () => void
  setOffersRadiusM: (radiusM: number) => void
  toggleOffersAdFormat: (format: OfferAdFormat) => void
}

/** User-facing platform settings; theme and offer preferences persist across sessions. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      panelOpen: false,
      offersRadiusM: OFFERS_MAX_RADIUS_M,
      offersAdFormats: ['BRANDED_PIN'],
      setTheme: (theme) => set({ theme }),
      openPanel: () => set({ panelOpen: true }),
      closePanel: () => set({ panelOpen: false }),
      setOffersRadiusM: (radiusM) =>
        set({
          offersRadiusM: Math.min(
            Math.max(Math.round(radiusM), OFFERS_MIN_RADIUS_M),
            OFFERS_MAX_RADIUS_M
          )
        }),
      toggleOffersAdFormat: (format) =>
        set((state) => ({
          offersAdFormats: state.offersAdFormats.includes(format)
            ? state.offersAdFormats.filter((candidate) => candidate !== format)
            : [...state.offersAdFormats, format]
        }))
    }),
    {
      name: 'cockpit-settings',
      partialize: (state) => ({
        theme: state.theme,
        offersRadiusM: state.offersRadiusM,
        offersAdFormats: state.offersAdFormats
      })
    }
  )
)
