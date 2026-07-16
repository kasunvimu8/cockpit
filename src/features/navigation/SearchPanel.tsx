import { useEffect, useRef, useState } from 'react'
import type { PlaceSuggestion } from '../../services/places/googlePlacesSearch'
import { SearchIcon } from '../../shared/components/icons'
import { useNavigationStore } from '../../store/navigationStore'
import { useSearchUIStore } from '../../store/searchUIStore'
import { useToastStore } from '../../store/toastStore'
import { MIN_QUERY_LENGTH, usePlaceSuggestions } from './usePlaceSuggestions'
import { useRoutePlanner, yourLocationTarget } from './useRoutePlanner'

/** Search flyout: Google Places lookup for destinations, opened from the floating search button. */
export function SearchPanel() {
  const [query, setQuery] = useState('')
  const open = useSearchUIStore((state) => state.open)
  const closeSearch = useSearchUIStore((state) => state.close)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const planRoute = useRoutePlanner()
  const phase = useNavigationStore((state) => state.phase)
  const { results, searching } = usePlaceSuggestions(query)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) closeSearch()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, closeSearch])

  const onSelect = async (result: PlaceSuggestion) => {
    closeSearch()
    setQuery(result.name)
    inputRef.current?.blur()
    try {
      const coord = await result.resolve()
      await planRoute(await yourLocationTarget(), { name: result.name, coord })
      setQuery('')
    } catch {
      useToastStore.getState().show('Could not resolve that place — try another result')
    }
  }

  const showDropdown = open && query.trim().length >= MIN_QUERY_LENGTH

  // the directions panel (preview) or the turn banner (navigating) takes this corner
  if (phase !== 'idle' || !open) return null

  return (
    <div
      ref={panelRef}
      className="absolute left-[calc(var(--hu)*82px)] top-[calc(var(--hu)*72px)] z-8 w-[300px]"
    >
      <div className="flex cursor-text items-center gap-2.5 rounded-[14px] border border-btn-border bg-surface px-3.5 py-[11px] shadow-[0_6px_24px_#0000001f] backdrop-blur-sm">
        <SearchIcon className="h-4 w-4 flex-none text-muted" />
        <input
          ref={inputRef}
          className="flex-1 border-none bg-transparent font-sans text-[13.5px] text-text outline-none placeholder:text-muted"
          type="text"
          placeholder="Navigate to…"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {showDropdown && (
        <div className="mt-1.5 overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_10px_30px_#00000022]">
          {searching && <div className="px-3.5 py-2.5 text-[10.5px] text-muted">Searching…</div>}
          {!searching && results.length === 0 && (
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
