export const GOOGLE_MAPS_API_KEY: string = (
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? ''
).trim()

export const GOOGLE_MAPS_MAP_ID: string =
  ((import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined) ?? '').trim() || 'DEMO_MAP_ID'

export type MapProviderName = 'google' | 'maplibre'

/** Google Maps when an API key is configured; MapLibre/OpenFreeMap otherwise. */
export const MAP_PROVIDER: MapProviderName = GOOGLE_MAPS_API_KEY ? 'google' : 'maplibre'
