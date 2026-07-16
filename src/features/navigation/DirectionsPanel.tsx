import { useEffect, useRef, useState } from 'react'
import type { PlaceSuggestion } from '../../services/places/googlePlacesSearch'
import { useNavigationStore } from '../../store/navigationStore'
import { useToastStore } from '../../store/toastStore'
import { MIN_QUERY_LENGTH, usePlaceSuggestions } from './usePlaceSuggestions'
import { useRoutePlanner, yourLocationTarget } from './useRoutePlanner'

type Field = 'origin' | 'destination'

const INPUT_CLASSES =
  'flex-1 border-none bg-transparent font-sans text-[13px] text-text outline-none placeholder:text-muted'

/**
 * Google-style directions editor shown during route preview: origin and destination are
 * both visible and changeable; edits re-plan the journey.
 */
export function DirectionsPanel() {
  const phase = useNavigationStore((state) => state.phase)
  const origin = useNavigationStore((state) => state.origin)
  const destination = useNavigationStore((state) => state.destination)
  const planRoute = useRoutePlanner()
  const panelRef = useRef<HTMLDivElement>(null)
  const [activeField, setActiveField] = useState<Field | null>(null)
  const [query, setQuery] = useState('')
  const { results, searching } = usePlaceSuggestions(query)

  // leaving preview or a re-plan resets the editing state
  useEffect(() => {
    setActiveField(null)
    setQuery('')
  }, [])

  useEffect(() => {
    if (!activeField) return
    const onPointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setActiveField(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [activeField])

  if (phase !== 'preview' || !origin || !destination) return null

  const onSelect = async (suggestion: PlaceSuggestion) => {
    const field = activeField
    setActiveField(null)
    setQuery('')
    try {
      const coord = await suggestion.resolve()
      const target = { name: suggestion.name, coord }
      if (field === 'origin') await planRoute(target, destination)
      else await planRoute(origin, target)
    } catch {
      useToastStore.getState().show('Could not resolve that place — try another result')
    }
  }

  const onUseYourLocation = async () => {
    setActiveField(null)
    setQuery('')
    await planRoute(await yourLocationTarget(), destination)
  }

  const onSwap = async () => {
    setActiveField(null)
    setQuery('')
    await planRoute(destination, origin)
  }

  const fieldValue = (field: Field) =>
    activeField === field ? query : field === 'origin' ? origin.name : destination.name

  const showDropdown =
    activeField !== null && (query.trim().length >= MIN_QUERY_LENGTH || activeField === 'origin')

  return (
    <div
      ref={panelRef}
      className="absolute left-[calc(var(--hu)*82px)] top-[calc(var(--hu)*72px)] z-8 w-[300px]"
    >
      <div className="flex items-center rounded-[14px] border border-btn-border bg-surface py-1 pl-3.5 pr-1.5 shadow-[0_6px_24px_#0000001f] backdrop-blur-sm">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 border-b border-line py-2.5">
            <span className="h-2.5 w-2.5 flex-none rounded-full border-[2.5px] border-[#4285f4] bg-white" />
            <input
              className={INPUT_CLASSES}
              type="text"
              placeholder="Choose starting point"
              autoComplete="off"
              value={fieldValue('origin')}
              onFocus={(event) => {
                setActiveField('origin')
                setQuery('')
                event.target.select()
              }}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2.5 py-2.5">
            <span className="h-2.5 w-2.5 flex-none rounded-full bg-red" />
            <input
              className={INPUT_CLASSES}
              type="text"
              placeholder="Choose destination"
              autoComplete="off"
              value={fieldValue('destination')}
              onFocus={(event) => {
                setActiveField('destination')
                setQuery('')
                event.target.select()
              }}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <button
          type="button"
          className="ml-1.5 flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-muted transition-colors hover:bg-hover hover:text-text"
          aria-label="Swap start and destination"
          onClick={onSwap}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M5 2.5 L5 11 M5 2.5 L2.5 5 M5 2.5 L7.5 5 M11 13.5 L11 5 M11 13.5 L8.5 11 M11 13.5 L13.5 11"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </button>
      </div>
      {showDropdown && (
        <div className="mt-1.5 overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_10px_30px_#00000022]">
          {activeField === 'origin' && (
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-[11px] border-b border-line bg-transparent px-3.5 py-2.5 text-left font-sans transition-colors hover:bg-hover"
              onClick={onUseYourLocation}
            >
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-chip text-[13px]">
                🧭
              </span>
              <span className="text-[12.5px] font-semibold text-accent">Your location</span>
            </button>
          )}
          {searching && <div className="px-3.5 py-2.5 text-[10.5px] text-muted">Searching…</div>}
          {!searching && query.trim().length >= MIN_QUERY_LENGTH && results.length === 0 && (
            <div className="px-3.5 py-2.5 text-[10.5px] text-muted">No results</div>
          )}
          {!searching &&
            results.map((result) => (
              <button
                key={result.id}
                type="button"
                className="flex w-full cursor-pointer items-center gap-[11px] border-b border-line bg-transparent px-3.5 py-2.5 text-left font-sans transition-colors last:border-b-0 hover:bg-hover"
                onClick={() => onSelect(result)}
              >
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-chip text-[13px]">
                  📍
                </span>
                <span className="block min-w-0">
                  <b className="block overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] font-semibold text-text">
                    {result.name}
                  </b>
                  <span className="text-[10.5px] text-muted">{result.subtitle}</span>
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
