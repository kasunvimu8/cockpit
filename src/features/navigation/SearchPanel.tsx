import { useEffect, useRef, useState } from 'react'
import { DESTINATIONS } from '../../data/destinations'
import { DEFAULT_START } from '../../data/routes'
import { MAP_PROVIDER } from '../../services/map/mapProvider'
import type { PoiOffer } from '../../services/offers/offersClient'
import { fetchNearbyOffers } from '../../services/offers/offersClient'
import type { PlaceResult, PlaceSuggestion } from '../../services/places/googlePlacesSearch'
import { searchPlacesByText } from '../../services/places/googlePlacesSearch'
import {
  BackIcon,
  BurgerIcon,
  CoffeeIcon,
  FuelIcon,
  HeartIcon,
  MegaphoneIcon,
  ParkingIcon,
  SearchIcon
} from '../../shared/components/icons'
import { formatDistanceM } from '../../shared/lib/format'
import type { LngLat } from '../../shared/lib/geo'
import { haversineDistance } from '../../shared/lib/geo'
import { useNavigationStore } from '../../store/navigationStore'
import { useOffersStore } from '../../store/offersStore'
import { useSearchUIStore } from '../../store/searchUIStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useSimulationStore } from '../../store/simulationStore'
import { useToastStore } from '../../store/toastStore'
import { driveSimulator } from '../simulation/DriveSimulator'
import { MIN_QUERY_LENGTH, usePlaceSuggestions } from './usePlaceSuggestions'
import { useRoutePlanner, yourLocationTarget } from './useRoutePlanner'

interface SearchCategory {
  id: string
  label: string
  Icon: (props: { className?: string }) => React.JSX.Element
  /** Google Places text query; null = category not wired yet. */
  searchTerm: string | null
  /** Offers-service POI category for the sponsored SEARCH results. */
  poiCategory: string | null
}

const CATEGORIES: SearchCategory[] = [
  { id: 'favourites', label: 'Favourites', Icon: HeartIcon, searchTerm: null, poiCategory: null },
  { id: 'coffee', label: 'Coffee', Icon: CoffeeIcon, searchTerm: 'coffee', poiCategory: 'CAFE' },
  {
    id: 'food',
    label: 'Food',
    Icon: BurgerIcon,
    searchTerm: 'supermarket',
    poiCategory: 'SUPERMARKET'
  },
  {
    id: 'fuel',
    label: 'Fuel',
    Icon: FuelIcon,
    searchTerm: 'ev charging station',
    poiCategory: 'ELECTRIC_VEHICLE_CHARGING_STATION'
  },
  { id: 'parking', label: 'Parking', Icon: ParkingIcon, searchTerm: 'parking', poiCategory: null }
]

/** At most this many result cards per category; the row scrolls if they overflow. */
const MAX_RESULT_CARDS = 4

interface CategoryResults {
  sponsored: PoiOffer[]
  places: PlaceResult[]
}

/** Offline category fallback when no Google Maps API key is configured. */
function offlinePlaces(term: string): PlaceResult[] {
  const normalised = term.toLowerCase()
  return DESTINATIONS.filter((entry) =>
    `${entry.name} ${entry.subtitle}`.toLowerCase().includes(normalised)
  ).map((entry) => ({
    id: entry.id,
    name: entry.name,
    address: entry.subtitle,
    coord: entry.coord
  }))
}

/**
 * "Where to?" search dock, opened from the floating search button: a bottom bar with the
 * destination input (Google Places lookup, suggestions opening upwards) and quick search
 * categories. Tapping a category runs the SEARCH ad format flow: sponsored offers for the
 * category's POIs are fetched from the supply service and shown as highlighted cards
 * ahead of the organic Google results, in a row above the bar (4screen Figma design).
 */
export function SearchPanel() {
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(false)
  const [activeCategory, setActiveCategory] = useState<SearchCategory | null>(null)
  const [categoryResults, setCategoryResults] = useState<CategoryResults | null>(null)
  const open = useSearchUIStore((state) => state.open)
  const closeSearch = useSearchUIStore((state) => state.close)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const categoryRequest = useRef(0)
  const planRoute = useRoutePlanner()
  const phase = useNavigationStore((state) => state.phase)
  const speedKmh = useSimulationStore((state) => state.speedKmh)
  const { results, searching } = usePlaceSuggestions(query)

  useEffect(() => {
    if (!open) {
      setVisible(false)
      setActiveCategory(null)
      setCategoryResults(null)
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

  const vehiclePosition = (): LngLat => driveSimulator.position ?? DEFAULT_START

  const travelLabels = (coord: LngLat) => {
    const distanceM = haversineDistance(vehiclePosition(), coord)
    const minutes = Math.max(1, Math.round(distanceM / (speedKmh / 3.6) / 60))
    return { minutes: `${minutes} min`, distance: formatDistanceM(distanceM) }
  }

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

  const onCategory = async (category: SearchCategory) => {
    if (!category.searchTerm) {
      useToastStore.getState().show(`${category.label} — demo placeholder`)
      return
    }
    const request = ++categoryRequest.current
    setQuery('')
    setActiveCategory(category)
    setCategoryResults(null)
    const center = vehiclePosition()
    // sponsored results only when the SEARCH ad format is enabled in the settings
    const searchAdsEnabled = useSettingsStore.getState().offersAdFormats.includes('SEARCH')
    const [sponsored, places] = await Promise.all([
      searchAdsEnabled && category.poiCategory
        ? fetchNearbyOffers(
            center,
            ['SEARCH'],
            useSettingsStore.getState().offersRadiusM,
            10,
            undefined,
            [category.poiCategory]
          )
            .then((offers) => offers.filter((offer) => offer.searchAd))
            .catch(() => [] as PoiOffer[])
        : Promise.resolve([] as PoiOffer[]),
      MAP_PROVIDER === 'google'
        ? searchPlacesByText(category.searchTerm, center).catch(() => [] as PlaceResult[])
        : Promise.resolve(offlinePlaces(category.searchTerm))
    ])
    if (categoryRequest.current !== request) return
    // sponsored POIs stay exclusive to their highlighted card
    const sponsoredNames = new Set(sponsored.map((offer) => offer.name.toLowerCase()))
    // sponsored results lead; organic Google results fill the row up to the card limit
    const limitedSponsored = sponsored.slice(0, MAX_RESULT_CARDS)
    setCategoryResults({
      sponsored: limitedSponsored,
      places: places
        .filter((place) => !sponsoredNames.has(place.name.toLowerCase()))
        .slice(0, Math.max(0, MAX_RESULT_CARDS - limitedSponsored.length))
    })
  }

  const onSponsored = (offer: PoiOffer) => {
    closeSearch()
    useOffersStore.getState().upsertOffer(offer)
    useOffersStore.getState().select(offer.id)
  }

  const onPlace = async (place: PlaceResult) => {
    closeSearch()
    await planRoute(await yourLocationTarget(), { name: place.name, coord: place.coord })
  }

  const showDropdown = !activeCategory && open && query.trim().length >= MIN_QUERY_LENGTH

  // the route preview card (preview) or the ETA bar (navigating) takes the bottom edge
  if (phase !== 'idle' || !open) return null

  return (
    <div ref={panelRef} className="absolute inset-x-0 bottom-0 z-8">
      {activeCategory && (
        <div className="mb-[calc(var(--hu)*12px)] px-[calc(var(--hu)*26px)]">
          <button
            type="button"
            aria-label="Back to categories"
            className="mb-[calc(var(--hu)*10px)] flex h-[calc(var(--hu)*36px)] w-[calc(var(--hu)*36px)] cursor-pointer items-center justify-center rounded-full border border-btn-border bg-btn-bg text-text shadow-[0_6px_20px_#0000001a] backdrop-blur-sm transition-colors hover:bg-active-bg"
            onClick={() => {
              setActiveCategory(null)
              setCategoryResults(null)
            }}
          >
            <BackIcon className="h-[calc(var(--hu)*15px)] w-[calc(var(--hu)*15px)]" />
          </button>
          <div className="flex items-end gap-[calc(var(--hu)*12px)] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {!categoryResults && (
              <div className="rounded-xl border border-line bg-surface px-4 py-3 text-xs text-muted shadow-[0_8px_24px_#0000001f]">
                Searching {activeCategory.label.toLowerCase()}…
              </div>
            )}
            {categoryResults?.sponsored.map((offer) => {
              const labels = travelLabels(offer.coord)
              return (
                <button
                  key={offer.id}
                  type="button"
                  className="w-[calc(var(--hu)*252px)] flex-none cursor-pointer overflow-hidden rounded-[14px] border-2 border-accent bg-surface text-left shadow-[0_8px_24px_#00000024] backdrop-blur-sm"
                  onClick={() => onSponsored(offer)}
                >
                  <span className="flex items-center gap-1.5 bg-accent px-3 py-[5px]">
                    <MegaphoneIcon className="h-3 w-3 flex-none text-white" />
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold text-white">
                      {offer.searchAd?.headline ?? 'Sponsored'}
                    </span>
                  </span>
                  <span className="block px-3 py-2">
                    <span className="flex items-center gap-2">
                      {offer.searchAd?.brandLogoImageUrl && (
                        <img
                          alt=""
                          src={offer.searchAd.brandLogoImageUrl}
                          className="h-8 w-8 flex-none rounded-lg border border-line object-cover"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <b className="block overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-bold text-text">
                          {offer.name}
                        </b>
                        {offer.isOpen !== undefined && (
                          <span
                            className={`text-[10.5px] font-semibold ${offer.isOpen ? 'text-nav-green' : 'text-red'}`}
                          >
                            {offer.isOpen ? 'Open' : 'Closed'}
                          </span>
                        )}
                      </span>
                      <span className="flex-none text-[12.5px] font-semibold text-text">
                        {labels.minutes}
                      </span>
                    </span>
                    <span className="mt-1 flex items-baseline justify-between gap-2">
                      {/* fixed two-line slot so every sponsored card has the same height */}
                      <span className="line-clamp-2 min-h-[calc(var(--hu)*29px)] min-w-0 text-[11px] leading-snug text-muted">
                        {offer.address}
                      </span>
                      <span className="flex-none text-[11px] text-muted">{labels.distance}</span>
                    </span>
                  </span>
                </button>
              )
            })}
            {/* organic results render deliberately smaller than the sponsored cards */}
            {categoryResults?.places.map((place, index) => {
              const labels = travelLabels(place.coord)
              return (
                <button
                  key={place.id}
                  type="button"
                  // sponsored-width card at ~75% of the sponsored height
                  className="w-[calc(var(--hu)*252px)] flex-none cursor-pointer rounded-xl border border-line bg-surface px-3.5 py-[calc(var(--hu)*16px)] text-left shadow-[0_6px_18px_#0000001a] backdrop-blur-sm"
                  onClick={() => onPlace(place)}
                >
                  <span className="flex items-center gap-2">
                    <span className="flex-none text-[12.5px] font-semibold text-accent">
                      {index + 1}.
                    </span>
                    <b className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-bold text-text">
                      {place.name}
                    </b>
                    <span className="flex-none text-[12.5px] font-semibold text-text">
                      {labels.minutes}
                    </span>
                  </span>
                  <span className="mt-1.5 flex items-baseline justify-between gap-2">
                    <span className="line-clamp-2 min-h-[calc(var(--hu)*29px)] min-w-0 text-[11px] leading-snug text-muted">
                      {place.address}
                    </span>
                    <span className="flex-none text-[11px] text-muted">{labels.distance}</span>
                  </span>
                </button>
              )
            })}
            {categoryResults &&
              categoryResults.sponsored.length + categoryResults.places.length === 0 && (
                <div className="rounded-xl border border-line bg-surface px-4 py-3 text-xs text-muted shadow-[0_8px_24px_#0000001f]">
                  No {activeCategory.label.toLowerCase()} nearby
                </div>
              )}
          </div>
        </div>
      )}

      <div
        className={`flex items-center gap-[calc(var(--hu)*20px)] bg-active-bg px-[calc(var(--hu)*26px)] py-[calc(var(--hu)*15px)] shadow-[0_-8px_28px_#0000001c] transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="relative w-[43%] min-w-[280px]">
          {showDropdown && (
            <div className="absolute inset-x-0 bottom-[calc(100%+10px)] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_10px_30px_#00000022] backdrop-blur-sm">
              {searching && (
                <div className="px-3.5 py-2.5 text-[10.5px] text-muted">Searching…</div>
              )}
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
              onChange={(event) => {
                setQuery(event.target.value)
                if (activeCategory) {
                  setActiveCategory(null)
                  setCategoryResults(null)
                }
              }}
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
              className={`flex h-[calc(var(--hu)*38px)] w-[calc(var(--hu)*38px)] cursor-pointer items-center justify-center rounded-full border-none text-text outline-none transition-colors hover:bg-hover ${activeCategory?.id === category.id ? 'bg-screen shadow-[0_2px_10px_#00000018]' : 'bg-transparent'}`}
              onClick={() => onCategory(category)}
            >
              <category.Icon className="h-[calc(var(--hu)*21px)] w-[calc(var(--hu)*21px)]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
