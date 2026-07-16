import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OfferAdFormat, RecommendationTrigger } from '../services/offers/offersClient'
import { OFFERS_MAX_RADIUS_M, OFFERS_MIN_RADIUS_M } from '../services/offers/offersClient'

export type Theme = 'light' | 'dark'

export const RECOMMENDATION_DELAY_MIN_S = 0
export const RECOMMENDATION_DELAY_MAX_S = 600

interface SettingsState {
  theme: Theme
  panelOpen: boolean
  /** Search radius for nearby ad offers, clamped to the service limits. */
  offersRadiusM: number
  /** Ad formats requested from the offers service and shown in the head unit. */
  offersAdFormats: OfferAdFormat[]
  /** Vehicle triggers the RECOMMENDATION format should react to. */
  recommendationTriggers: RecommendationTrigger[]
  /** Seconds after which the recommendation fires (e.g. 30 s into the drive). */
  recommendationDelayS: number
  setTheme: (theme: Theme) => void
  openPanel: () => void
  closePanel: () => void
  setOffersRadiusM: (radiusM: number) => void
  toggleOffersAdFormat: (format: OfferAdFormat) => void
  toggleRecommendationTrigger: (trigger: RecommendationTrigger) => void
  setRecommendationDelayS: (seconds: number) => void
}

/** User-facing platform settings; theme and offer preferences persist across sessions. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      panelOpen: false,
      offersRadiusM: OFFERS_MAX_RADIUS_M,
      offersAdFormats: ['BRANDED_PIN'],
      recommendationTriggers: [],
      recommendationDelayS: 30,
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
        })),
      toggleRecommendationTrigger: (trigger) =>
        set((state) => ({
          recommendationTriggers: state.recommendationTriggers.includes(trigger)
            ? state.recommendationTriggers.filter((candidate) => candidate !== trigger)
            : [...state.recommendationTriggers, trigger]
        })),
      setRecommendationDelayS: (seconds) =>
        set({
          recommendationDelayS: Math.min(
            Math.max(Math.round(seconds), RECOMMENDATION_DELAY_MIN_S),
            RECOMMENDATION_DELAY_MAX_S
          )
        })
    }),
    {
      name: 'cockpit-settings',
      partialize: (state) => ({
        theme: state.theme,
        offersRadiusM: state.offersRadiusM,
        offersAdFormats: state.offersAdFormats,
        recommendationTriggers: state.recommendationTriggers,
        recommendationDelayS: state.recommendationDelayS
      })
    }
  )
)
