import type { LngLat } from '../shared/lib/geo'

/**
 * Fallback vehicle position (Munich, Olympiapark district) used when browser
 * geolocation is unavailable or denied.
 */
export const DEFAULT_START: LngLat = [11.5627623, 48.1747559]
