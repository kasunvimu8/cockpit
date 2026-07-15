import type { LngLat } from '../../shared/lib/geo'

const GEOLOCATION_TIMEOUT_MS = 8000

/** The user's current position via browser geolocation, or null when unavailable/denied. */
export function getCurrentPosition(): Promise<LngLat | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve([position.coords.longitude, position.coords.latitude]),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 60000 }
    )
  })
}
