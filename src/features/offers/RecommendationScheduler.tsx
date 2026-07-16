import { useEffect, useRef } from 'react'
import { DEFAULT_START } from '../../data/routes'
import type { PoiOffer, RecommendationTrigger } from '../../services/offers/offersClient'
import { fetchNearbyOffers } from '../../services/offers/offersClient'
import { haversineDistance } from '../../shared/lib/geo'
import { useNavigationStore } from '../../store/navigationStore'
import { useOffersStore } from '../../store/offersStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useToastStore } from '../../store/toastStore'
import { driveSimulator } from '../simulation/DriveSimulator'

/**
 * Simulates an in-drive vehicle trigger: when guidance starts with the RECOMMENDATION
 * format enabled, waits the configured delay, then fires the offers request around the
 * live vehicle position. The service accepts one trigger per request, so the selected
 * triggers are tried in order until a campaign matches; the nearest matching offer is
 * presented as a recommendation card. One recommendation per trip.
 */
export function RecommendationScheduler() {
  const phase = useNavigationStore((state) => state.phase)
  const adFormats = useSettingsStore((state) => state.offersAdFormats)
  const delayS = useSettingsStore((state) => state.recommendationDelayS)
  const enabled = phase === 'navigating' && adFormats.includes('RECOMMENDATION')
  const firedThisTrip = useRef(false)

  useEffect(() => {
    if (phase !== 'navigating') firedThisTrip.current = false
  }, [phase])

  useEffect(() => {
    if (!enabled || firedThisTrip.current) return
    let cancelled = false

    const fire = async () => {
      firedThisTrip.current = true
      const { recommendationTriggers, offersRadiusM } = useSettingsStore.getState()
      const position = driveSimulator.position ?? DEFAULT_START
      // one trigger per request — try the selection in order until a campaign matches
      const attempts: (RecommendationTrigger | null)[] = recommendationTriggers.length
        ? recommendationTriggers
        : [null]
      for (const trigger of attempts) {
        let candidates: PoiOffer[] = []
        try {
          const offers = await fetchNearbyOffers(
            position,
            ['RECOMMENDATION'],
            offersRadiusM,
            20,
            trigger ?? undefined
          )
          candidates = offers.filter((offer) => offer.recommendation)
        } catch {
          break // service unreachable — no recommendation this trip
        }
        if (cancelled) return
        if (candidates.length > 0) {
          const nearest = candidates.reduce((best, offer) =>
            haversineDistance(offer.coord, position) < haversineDistance(best.coord, position)
              ? offer
              : best
          )
          useOffersStore.getState().showRecommendation(nearest, trigger)
          return
        }
      }
      if (!cancelled) useToastStore.getState().show('No recommendations nearby')
    }

    const timer = window.setTimeout(fire, delayS * 1000)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [enabled, delayS])

  return null
}
