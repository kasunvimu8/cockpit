import { useEffect, useState } from 'react'
import { useOffersStore } from '../../store/offersStore'
import { useToastStore } from '../../store/toastStore'
import { useRoutePlanner, yourLocationTarget } from '../navigation/useRoutePlanner'

/**
 * DETAILS_SCREEN ad format as a side panel, opened by tapping a branded pin. Modelled
 * after the portal's details-screen preview: product image, brand logo, POI name with
 * live open state, headline/description, address and the More Details / Navigate
 * call-to-actions. Navigate hands the POI to the route planner, turning the ad into a
 * guided trip. Falls back to POI data when the campaign carries no details assets.
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

  if (!offer) return null

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

      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {details?.productImageUrl1 && (
          <img
            alt=""
            src={details.productImageUrl1}
            className="mb-3 h-[140px] w-full rounded-xl border border-line object-cover"
          />
        )}
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img
              alt=""
              src={logoUrl}
              className="h-11 w-11 shrink-0 rounded-lg border border-line object-cover"
            />
          )}
          <div className="flex min-w-0 flex-col">
            <b className="overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-extrabold">
              {offer.name}
            </b>
            <div className="flex items-baseline gap-2">
              {offer.isOpen !== undefined && (
                <span
                  className={`text-xs font-semibold ${offer.isOpen ? 'text-nav-green' : 'text-red'}`}
                >
                  {offer.isOpen ? 'Open' : 'Closed'}
                </span>
              )}
              {offer.organizationName && (
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-muted">
                  {offer.organizationName}
                </span>
              )}
            </div>
          </div>
        </div>

        {headline && <div className="mt-3 text-sm font-semibold">{headline}</div>}
        {details?.description && (
          <p className="mb-0 mt-1.5 text-xs leading-relaxed text-muted">{details.description}</p>
        )}
        {offer.address && <div className="mt-3 text-xs text-muted">📍 {offer.address}</div>}
      </div>

      <div className="flex gap-2.5 border-t border-line px-4 py-3">
        <button
          type="button"
          className="flex-1 cursor-pointer rounded-[9px] border border-line bg-transparent px-3 py-[9px] font-sans text-[12.5px] font-semibold text-muted transition-[filter] hover:brightness-105"
          onClick={() => useToastStore.getState().show('More details — demo placeholder')}
        >
          More Details
        </button>
        <button
          type="button"
          className="flex-1 cursor-pointer rounded-full border-none bg-accent px-3 py-[9px] font-sans text-[12.5px] font-semibold text-white transition-[filter] hover:brightness-105"
          onClick={onNavigate}
        >
          Navigate
        </button>
      </div>
    </div>
  )
}
