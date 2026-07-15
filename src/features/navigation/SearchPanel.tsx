import { useEffect, useRef, useState } from 'react'
import type { PlaceSuggestion } from '../../services/places/googlePlacesSearch'
import { useNavigationStore } from '../../store/navigationStore'
import { useToastStore } from '../../store/toastStore'
import { MIN_QUERY_LENGTH, usePlaceSuggestions } from './usePlaceSuggestions'
import { useRoutePlanner, yourLocationTarget } from './useRoutePlanner'

/** Search overlay: Google Places lookup for destinations. */
export function SearchPanel() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const planRoute = useRoutePlanner()
  const phase = useNavigationStore((state) => state.phase)
  const { results, searching } = usePlaceSuggestions(query)

  useEffect(() => {
    if (!open) return
    const onDocumentClick = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocumentClick)
    return () => document.removeEventListener('click', onDocumentClick)
  }, [open])

  const onSelect = async (result: PlaceSuggestion) => {
    setOpen(false)
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
  if (phase !== 'idle') return null

  return (
    <div ref={panelRef} className="absolute left-3 top-3 z-5 w-[300px]">
      <div className="flex cursor-text items-center gap-2.5 rounded-[14px] border border-line bg-surface px-3.5 py-[11px] shadow-[0_6px_24px_#0000001f]">
        <span className="text-sm text-muted">🔍</span>
        <input
          ref={inputRef}
          className="flex-1 border-none bg-transparent font-sans text-[13.5px] text-text outline-none placeholder:text-muted"
          type="text"
          placeholder="Navigate to…"
          autoComplete="off"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
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
