import { useEffect, useState } from 'react'
import { fetchOfferDetails, hasDetailsScreen } from '../../services/offers/offersClient'
import { useOffersStore } from '../../store/offersStore'
import { useRoutePlanner, yourLocationTarget } from '../navigation/useRoutePlanner'

/**
 * DETAILS_SCREEN ad format as a side panel, opened by tapping a branded pin. Matches the
 * portal's details-screen reference: brand logo tile with POI name, live open state and
 * address, then the campaign title, product image and description, closed out by the
 * Back / Go call-to-actions. Go hands the POI to the route planner, turning the ad into
 * a guided trip. Details content is fetched on tap via the offer-assets endpoint; offers
 * that don't deliver the DETAILS_SCREEN format never open a panel at all.
 */
export function DetailsScreenPanel() {
  const offer = useOffersStore((state) =>
    state.offers.find((candidate) => candidate.id === state.selectedId)
  )
  const planRoute = useRoutePlanner()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!offer) {
      setVisible(false)
      return
    }
    const frame = requestAnimationFrame(() => setVisible(true))
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') useOffersStore.getState().select(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [offer])

  // production flow: the tapped pin only carries its offer token, so pull the full asset
  // set (details screen content) on demand and cache it back into the store
  useEffect(() => {
    if (!offer || offer.details || !offer.offerId) return
    const { id, offerId } = offer
    let cancelled = false
    fetchOfferDetails(offerId)
      .then((details) => {
        if (!cancelled && details) useOffersStore.getState().mergeDetails(id, details)
      })
      .catch(() => {
        // gateway-protected in the dev cluster (403) — stay on the fallback content
      })
    return () => {
      cancelled = true
    }
  }, [offer])

  if (!offer || !hasDetailsScreen(offer)) return null

  const details = offer.details
  const logoUrl = details?.brandLogoUrl ?? offer.pinImageUrl
  const headline = details?.headline ?? offer.headline
  const close = () => useOffersStore.getState().select(null)

  const onNavigate = async () => {
    close()
    await planRoute(await yourLocationTarget(), { name: offer.name, coord: offer.coord })
  }

  return (
    <div
      className={`absolute bottom-0 left-0 top-0 z-8 flex w-[300px] max-w-[70%] flex-col border-r border-line bg-surface shadow-[16px_0_40px_#00000030] backdrop-blur-xl transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : '-translate-x-full'}`}
      role="dialog"
      aria-label="Offer details"
    >
      <div className="flex items-center justify-between px-4 pb-1 pt-3">
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted">Sponsored</span>
        <button
          type="button"
          aria-label="Close offer"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-[13px] text-muted transition-colors hover:bg-hover"
          onClick={close}
        >
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img
              alt=""
              src={logoUrl}
              className="h-12 w-12 shrink-0 rounded-xl border border-line object-cover"
            />
          )}
          <div className="flex min-w-0 flex-col">
            <div className="flex items-baseline gap-2">
              <b className="overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-extrabold">
                {offer.name}
              </b>
              {offer.isOpen !== undefined && (
                <span
                  className={`shrink-0 text-xs font-semibold ${offer.isOpen ? 'text-nav-green' : 'text-red'}`}
                >
                  {offer.isOpen ? 'Open' : 'Closed'}
                </span>
              )}
            </div>
            {offer.address && (
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-muted">
                {offer.address}
              </span>
            )}
          </div>
        </div>

        {headline && <div className="mt-3 text-sm font-medium">{headline}</div>}
        {details?.productImageUrl1 && (
          <img
            alt=""
            src={details.productImageUrl1}
            className="mt-3 h-[140px] w-full rounded-lg border border-line object-cover"
          />
        )}
        {details?.description && (
          <p className="mb-0 mt-3 text-xs leading-relaxed">{details.description}</p>
        )}
      </div>

      <div className="flex gap-2.5 border-t border-line px-4 py-3">
        <button
          type="button"
          className="flex-1 cursor-pointer rounded-full border border-accent bg-transparent px-3 py-[9px] font-sans text-[12.5px] font-semibold text-accent transition-colors hover:bg-hover"
          onClick={close}
        >
          Back
        </button>
        <button
          type="button"
          className="flex-1 cursor-pointer rounded-full border-none bg-accent px-3 py-[9px] font-sans text-[12.5px] font-semibold text-white transition-[filter] hover:brightness-105"
          onClick={onNavigate}
        >
          Go
        </button>
      </div>
    </div>
  )
}
