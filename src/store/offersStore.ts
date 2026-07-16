import { create } from 'zustand'
import type {
  DetailsScreenContent,
  PoiOffer,
  RecommendationTrigger
} from '../services/offers/offersClient'

type OffersStatus = 'idle' | 'loading' | 'ready' | 'error'

/** The recommendation currently presented to the driver and the trigger that fired it. */
export interface ActiveRecommendation {
  offerId: string
  trigger: RecommendationTrigger | null
}

interface OffersState {
  status: OffersStatus
  offers: PoiOffer[]
  /** POI id of the offer whose details screen is open, if any. */
  selectedId: string | null
  recommendation: ActiveRecommendation | null
  setStatus: (status: OffersStatus) => void
  setOffers: (offers: PoiOffer[]) => void
  select: (selectedId: string | null) => void
  /** Caches details content fetched on tap, so reopening the offer skips the request. */
  mergeDetails: (id: string, details: DetailsScreenContent) => void
  /** Presents a recommendation card, upserting its offer into the result set. */
  showRecommendation: (offer: PoiOffer, trigger: RecommendationTrigger | null) => void
  dismissRecommendation: () => void
  /** Adds or refreshes an offer (e.g. a sponsored search result) in the result set. */
  upsertOffer: (offer: PoiOffer) => void
}

/** Live ad offers (branded pins + details screens) fetched around the vehicle. */
export const useOffersStore = create<OffersState>()((set) => ({
  status: 'idle',
  offers: [],
  selectedId: null,
  recommendation: null,
  setStatus: (status) => set({ status }),
  setOffers: (offers) =>
    set((state) => ({
      offers,
      status: 'ready',
      // drop selection/recommendation when their offer is no longer in the result set
      selectedId: offers.some((offer) => offer.id === state.selectedId) ? state.selectedId : null,
      recommendation: offers.some((offer) => offer.id === state.recommendation?.offerId)
        ? state.recommendation
        : null
    })),
  select: (selectedId) => set({ selectedId }),
  mergeDetails: (id, details) =>
    set((state) => ({
      offers: state.offers.map((offer) => (offer.id === id ? { ...offer, details } : offer))
    })),
  showRecommendation: (offer, trigger) =>
    set((state) => ({
      offers: state.offers.some((candidate) => candidate.id === offer.id)
        ? state.offers.map((candidate) =>
            candidate.id === offer.id ? { ...candidate, ...offer } : candidate
          )
        : [...state.offers, offer],
      recommendation: { offerId: offer.id, trigger }
    })),
  dismissRecommendation: () => set({ recommendation: null }),
  upsertOffer: (offer) =>
    set((state) => ({
      offers: state.offers.some((candidate) => candidate.id === offer.id)
        ? state.offers.map((candidate) =>
            candidate.id === offer.id ? { ...candidate, ...offer } : candidate
          )
        : [...state.offers, offer]
    }))
}))

if (import.meta.env.DEV) {
  // console handle to drive the offers UI without the map (the embedded browser preview
  // suppresses requestAnimationFrame, so branded pins can't be tapped there)
  ;(window as unknown as Record<string, unknown>).__offersStore = useOffersStore
}
