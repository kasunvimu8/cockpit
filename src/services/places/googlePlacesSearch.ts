import { importLibrary } from '@googlemaps/js-api-loader'
import type { LngLat } from '../../shared/lib/geo'

const LOCATION_BIAS_RADIUS_M = 30000

export interface PlaceSuggestion {
  id: string
  name: string
  subtitle: string
  /** Fetches the place coordinate; ends the autocomplete billing session. */
  resolve: () => Promise<LngLat>
}

let sessionToken: google.maps.places.AutocompleteSessionToken | null = null

/** Autocomplete suggestions from the Google Places API, biased around the vehicle. */
export async function fetchPlaceSuggestions(
  query: string,
  near: LngLat
): Promise<PlaceSuggestion[]> {
  const places = await importLibrary('places')
  if (!sessionToken) sessionToken = new places.AutocompleteSessionToken()
  const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: query,
    sessionToken,
    locationBias: { center: { lat: near[1], lng: near[0] }, radius: LOCATION_BIAS_RADIUS_M }
  })
  return suggestions.flatMap((suggestion) => {
    const prediction = suggestion.placePrediction
    if (!prediction) return []
    return [
      {
        id: prediction.placeId,
        name: prediction.mainText?.text ?? prediction.text.text,
        subtitle: prediction.secondaryText?.text ?? '',
        resolve: async () => {
          const place = prediction.toPlace()
          await place.fetchFields({ fields: ['location'] })
          sessionToken = null
          const location = place.location
          if (!location) throw new Error('Place has no location')
          return [location.lng(), location.lat()] as LngLat
        }
      }
    ]
  })
}
