import { useEffect, useRef } from 'react'
import { DEFAULT_START } from '../../data/routes'
import { fetchNearbyOffers, hasDetailsScreen } from '../../services/offers/offersClient'
import { useBootStore } from '../../store/bootStore'
import { useOffersStore } from '../../store/offersStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useMapAdapter } from '../map/MapContext'
import { driveSimulator } from '../simulation/DriveSimulator'

/** Settles rapid radius/format changes in the settings panel before refetching. */
const REFETCH_DEBOUNCE_MS = 600

/**
 * Headless layer for live ad offers: fetches the configured ad formats around the vehicle
 * (refetching when the radius or format selection changes) and keeps the branded pins on
 * the map in sync. Tapping a pin opens the offer's details screen.
 */
export function OffersLayer() {
  const adapter = useMapAdapter()
  const routeReady = useBootStore((state) => state.routeReady)
  const radiusM = useSettingsStore((state) => state.offersRadiusM)
  const adFormats = useSettingsStore((state) => state.offersAdFormats)
  const offers = useOffersStore((state) => state.offers)
  const requestId = useRef(0)

  useEffect(() => {
    if (!routeReady) return
    const request = ++requestId.current
    if (adFormats.length === 0) {
      useOffersStore.getState().setOffers([])
      return
    }
    useOffersStore.getState().setStatus('loading')
    const timer = window.setTimeout(() => {
      fetchNearbyOffers(driveSimulator.position ?? DEFAULT_START, adFormats, radiusM)
        .then((nearby) => {
          if (requestId.current !== request) return
          useOffersStore.getState().setOffers(nearby)
        })
        .catch(() => {
          if (requestId.current !== request) return
          useOffersStore.getState().setStatus('error')
          useBootStore.getState().showNotice('Offers unavailable — supply service unreachable')
        })
    }, REFETCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [routeReady, radiusM, adFormats])

  useEffect(() => {
    if (!adapter) return
    // only the BRANDED_PIN format is rendered on the map (when enabled in the settings)
    const pinOffers = adFormats.includes('BRANDED_PIN')
      ? offers.filter((offer) => offer.formats.includes('BRANDED_PIN'))
      : []
    adapter.setOfferPins(
      pinOffers.map((offer) => ({
        id: offer.id,
        coord: offer.coord,
        imageUrl: offer.pinImageUrl ?? offer.details?.brandLogoUrl ?? null,
        name: offer.name,
        // pin-only campaigns have no details screen to open, so their taps are inert
        onSelect: hasDetailsScreen(offer)
          ? () => useOffersStore.getState().select(offer.id)
          : () => {}
      }))
    )
    return () => adapter.setOfferPins([])
  }, [adapter, offers, adFormats])

  return null
}
