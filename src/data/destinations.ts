import type { LngLat } from '../shared/lib/geo'

export interface DestinationEntry {
  id: string
  name: string
  subtitle: string
  icon: string
  coord: LngLat
}

/** Offline search fallback used when no Google Maps API key is configured. */
export const DESTINATIONS: DestinationEntry[] = [
  {
    id: 'marienplatz',
    name: 'Marienplatz',
    subtitle: 'City centre · Munich',
    icon: '🏛️',
    coord: [11.5754, 48.1372]
  },
  {
    id: 'hauptbahnhof',
    name: 'Hauptbahnhof',
    subtitle: 'Central station',
    icon: '🚉',
    coord: [11.5582, 48.1403]
  },
  {
    id: 'olympiapark',
    name: 'Olympiapark',
    subtitle: 'Park & arena',
    icon: '🏟️',
    coord: [11.55, 48.1758]
  },
  {
    id: 'bmw-welt',
    name: 'BMW Welt',
    subtitle: 'Am Olympiapark 1',
    icon: '🚗',
    coord: [11.5561, 48.1772]
  },
  {
    id: 'englischer-garten',
    name: 'Englischer Garten',
    subtitle: 'Park',
    icon: '🌳',
    coord: [11.6031, 48.1642]
  }
]
