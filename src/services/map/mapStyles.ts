import type { StyleSpecification } from 'maplibre-gl'
import type { Theme } from '../../store/settingsStore'

const VECTOR_STYLE_URLS: Record<Theme, string> = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark'
}

export function vectorStyleUrl(theme: Theme): string {
  return VECTOR_STYLE_URLS[theme]
}

export const BUILDING_COLORS: Record<Theme, string> = {
  light: '#dde3ed',
  dark: '#343b47'
}

export const RASTER_FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
}

export const BUILDINGS_LAYER_ID = '3d-buildings'
