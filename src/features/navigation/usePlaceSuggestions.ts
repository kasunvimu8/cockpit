import { useEffect, useState } from 'react'
import { DESTINATIONS } from '../../data/destinations'
import { DEFAULT_START } from '../../data/routes'
import { MAP_PROVIDER } from '../../services/map/mapProvider'
import type { PlaceSuggestion } from '../../services/places/googlePlacesSearch'
import { fetchPlaceSuggestions } from '../../services/places/googlePlacesSearch'
import { driveSimulator } from '../simulation/DriveSimulator'

export const MIN_QUERY_LENGTH = 3
const SEARCH_DEBOUNCE_MS = 300

/** Offline fallback used when no Google Maps API key is configured. */
function staticSuggestions(query: string): PlaceSuggestion[] {
  const normalised = query.toLowerCase()
  return DESTINATIONS.filter((entry) => entry.name.toLowerCase().includes(normalised)).map(
    (entry) => ({
      id: entry.id,
      name: entry.name,
      subtitle: entry.subtitle,
      resolve: async () => entry.coord
    })
  )
}

/** Debounced place lookup around the vehicle: Google Places, or the offline fallback. */
export function usePlaceSuggestions(query: string): {
  results: PlaceSuggestion[]
  searching: boolean
} {
  const [results, setResults] = useState<PlaceSuggestion[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const suggestions =
          MAP_PROVIDER === 'google'
            ? await fetchPlaceSuggestions(trimmed, driveSimulator.position ?? DEFAULT_START)
            : staticSuggestions(trimmed)
        if (cancelled) return
        setResults(suggestions)
        setSearching(false)
      } catch {
        if (cancelled) return
        setResults([])
        setSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query])

  return { results, searching }
}
