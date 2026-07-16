import { useEffect, useState } from 'react'
import { hasDetailsScreen } from '../../services/offers/offersClient'
import { useOffersStore } from '../../store/offersStore'
import { RECOMMENDATION_TRIGGER_OPTIONS } from '../settings/RecommendationTriggerSelect'

/**
 * RECOMMENDATION ad format: an in-drive notification card (brand logo, headline,
 * description) that slides in from the top when a vehicle trigger fires. Tapping View
 * opens the offer's details screen; ✕ dismisses.
 */
export function RecommendationCard() {
  const recommendation = useOffersStore((state) => state.recommendation)
  const offer = useOffersStore((state) =>
    state.recommendation
      ? (state.offers.find((candidate) => candidate.id === state.recommendation?.offerId) ?? null)
      : null
  )
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!offer) {
      setVisible(false)
      return
    }
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [offer])

  if (!offer?.recommendation) return null

  const content = offer.recommendation
  const triggerLabel = RECOMMENDATION_TRIGGER_OPTIONS.find(
    (option) => option.value === recommendation?.trigger
  )?.label
  const dismiss = () => useOffersStore.getState().dismissRecommendation()

  const onView = () => {
    dismiss()
    useOffersStore.getState().select(offer.id)
  }

  return (
    <div
      className={`absolute left-1/2 top-3 z-7 w-[420px] max-w-[80%] -translate-x-1/2 rounded-2xl border border-line bg-surface p-3.5 shadow-[0_14px_40px_#00000038] backdrop-blur-xl transition-all duration-300 ease-out ${visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
      role="dialog"
      aria-label="Recommendation"
    >
      <div className="flex items-start gap-3">
        {content.brandLogoImageUrl && (
          <img
            alt=""
            src={content.brandLogoImageUrl}
            className="h-11 w-11 shrink-0 rounded-lg border border-line object-cover"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted">
            {triggerLabel ? `${triggerLabel} · Sponsored` : 'Sponsored'}
          </span>
          {content.headline && (
            <b className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-bold">
              {content.headline}
            </b>
          )}
          {content.description && (
            <p className="m-0 line-clamp-2 text-xs leading-snug text-muted">
              {content.description}
            </p>
          )}
          <span className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-muted">
            📍 {offer.name}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end justify-between gap-2 self-stretch">
          <button
            type="button"
            aria-label="Dismiss recommendation"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-xs text-muted transition-colors hover:bg-hover"
            onClick={dismiss}
          >
            ✕
          </button>
          {/* campaigns without a details screen have nothing to open */}
          {hasDetailsScreen(offer) && (
            <button
              type="button"
              className="cursor-pointer rounded-full border-none bg-accent px-4 py-1.5 font-sans text-xs font-semibold text-white transition-[filter] hover:brightness-105"
              onClick={onView}
            >
              View
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
