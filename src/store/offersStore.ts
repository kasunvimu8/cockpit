import { create } from 'zustand'
import type { DetailsScreenContent, PoiOffer } from '../services/offers/offersClient'

type OffersStatus = 'idle' | 'loading' | 'ready' | 'error'

interface OffersState {
  status: OffersStatus
  offers: PoiOffer[]
  /** POI id of the offer whose details screen is open, if any. */
  selectedId: string | null
  setStatus: (status: OffersStatus) => void
  setOffers: (offers: PoiOffer[]) => void
  select: (selectedId: string | null) => void
  /** Caches details content fetched on tap, so reopening the offer skips the request. */
  mergeDetails: (id: string, details: DetailsScreenContent) => void
}

/** Live ad offers (branded pins + details screens) fetched around the vehicle. */
export const useOffersStore = create<OffersState>()((set) => ({
  status: 'idle',
  offers: [],
  selectedId: null,
  setStatus: (status) => set({ status }),
  setOffers: (offers) =>
    set((state) => ({
      offers,
      status: 'ready',
      // drop the selection when its offer is no longer in the result set
      selectedId: offers.some((offer) => offer.id === state.selectedId) ? state.selectedId : null
    })),
  select: (selectedId) => set({ selectedId }),
  mergeDetails: (id, details) =>
    set((state) => ({
      offers: state.offers.map((offer) => (offer.id === id ? { ...offer, details } : offer))
    }))
}))

if (import.meta.env.DEV) {
  // console handle to drive the offers UI without the map (the embedded browser preview
  // suppresses requestAnimationFrame, so branded pins can't be tapped there)
  ;(window as unknown as Record<string, unknown>).__offersStore = useOffersStore
}
