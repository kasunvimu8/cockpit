import { useEffect, useRef, useState } from 'react'
import type { PlaceSuggestion } from '../../services/places/googlePlacesSearch'
import {
  BurgerIcon,
  CoffeeIcon,
  FuelIcon,
  HeartIcon,
  ParkingIcon,
  SearchIcon
} from '../../shared/components/icons'
import { useNavigationStore } from '../../store/navigationStore'
import { useSearchUIStore } from '../../store/searchUIStore'
import { useToastStore } from '../../store/toastStore'
import { MIN_QUERY_LENGTH, usePlaceSuggestions } from './usePlaceSuggestions'
import { useRoutePlanner, yourLocationTarget } from './useRoutePlanner'

interface SearchCategory {
  id: string
  label: string
  Icon: (props: { className?: string }) => React.JSX.Element
  /** Search term the category fills into the input; null = not wired yet. */
  query: string | null
}

const CATEGORIES: SearchCategory[] = [
  { id: 'favourites', label: 'Favourites', Icon: HeartIcon, query: null },
  { id: 'coffee', label: 'Coffee', Icon: CoffeeIcon, query: 'Coffee' },
  { id: 'food', label: 'Food', Icon: BurgerIcon, query: 'Burger' },
  { id: 'fuel', label: 'Fuel', Icon: FuelIcon, query: 'Petrol station' },
  { id: 'parking', label: 'Parking', Icon: ParkingIcon, query: 'Parking' }
]

/**
 * "Where to?" search dock, opened from the floating search button: a bottom bar with the
 * destination input (Google Places lookup, suggestions opening upwards) and quick search
 * categories, following the 4screen Figma design.
 */
export function SearchPanel() {
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(false)
  const open = useSearchUIStore((state) => state.open)
  const closeSearch = useSearchUIStore((state) => state.close)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const planRoute = useRoutePlanner()
  const phase = useNavigationStore((state) => state.phase)
  const { results, searching } = usePlaceSuggestions(query)

  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    inputRef.current?.focus()
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) closeSearch()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSearch()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
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

  const onCategory = (category: SearchCategory) => {
    if (!category.query) {
      useToastStore.getState().show(`${category.label} — demo placeholder`)
      return
    }
    setQuery(category.query)
    inputRef.current?.focus()
  }

  const showDropdown = open && query.trim().length >= MIN_QUERY_LENGTH

  // the route preview card (preview) or the ETA bar (navigating) takes the bottom edge
  if (phase !== 'idle' || !open) return null

  return (
    <div
      ref={panelRef}
      className={`absolute inset-x-0 bottom-0 z-8 flex items-center gap-[calc(var(--hu)*20px)] bg-active-bg px-[calc(var(--hu)*26px)] py-[calc(var(--hu)*15px)] shadow-[0_-8px_28px_#0000001c] transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="relative w-[43%] min-w-[280px]">
        {showDropdown && (
          <div className="absolute inset-x-0 bottom-[calc(100%+10px)] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_10px_30px_#00000022] backdrop-blur-sm">
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
        <div className="flex cursor-text items-center gap-2.5 rounded-full border border-line bg-screen py-[calc(var(--hu)*11px)] pl-[calc(var(--hu)*20px)] pr-[calc(var(--hu)*16px)]">
          <input
            ref={inputRef}
            className="flex-1 border-none bg-transparent font-sans text-[calc(var(--hu)*14px)] text-text outline-none placeholder:text-muted"
            type="text"
            placeholder="Where to?"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <SearchIcon className="h-[calc(var(--hu)*16px)] w-[calc(var(--hu)*16px)] flex-none text-text" />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-evenly">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            title={category.label}
            aria-label={`Search ${category.label}`}
            className="flex h-[calc(var(--hu)*38px)] w-[calc(var(--hu)*38px)] cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-text transition-colors hover:bg-hover"
            onClick={() => onCategory(category)}
          >
            <category.Icon className="h-[calc(var(--hu)*21px)] w-[calc(var(--hu)*21px)]" />
          </button>
        ))}
      </div>
    </div>
  )
}
