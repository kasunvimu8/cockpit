import { Map as MaplibreMap } from 'maplibre-gl'
import type { LngLat } from '../../shared/lib/geo'
import type { Theme } from '../../store/settingsStore'
import {
  BUILDING_COLORS,
  BUILDINGS_LAYER_ID,
  RASTER_FALLBACK_STYLE,
  vectorStyleUrl
} from './mapStyles'

const RASTER_FALLBACK_TIMEOUT_MS = 10000
const FATAL_TIMEOUT_MS = 22000
const STYLE_SETTLE_DELAY_MS = 400

export interface CockpitMapHandlers {
  onReady: (map: MaplibreMap) => void
  /** Fired after the base style has been replaced and decorations must be re-added. */
  onStyleReloaded: () => void
  onNotice: (message: string) => void
  onFatal: (message: string) => void
}

export interface CockpitMapController {
  /** Switches the base map style to match the theme (no-op on the raster fallback). */
  setTheme: (theme: Theme) => void
  dispose: () => void
}

/**
 * Creates the head-unit map with graceful degradation: a themed vector style with 3D
 * buildings, falling back to raster OSM tiles and finally a fatal error message.
 */
export function createCockpitMap(
  container: HTMLElement,
  center: LngLat,
  initialTheme: Theme,
  handlers: CockpitMapHandlers
): CockpitMapController {
  const map = new MaplibreMap({
    container,
    style: vectorStyleUrl(initialTheme),
    center,
    zoom: 15.5,
    pitch: 62,
    bearing: 0,
    attributionControl: { compact: true },
    interactive: false,
    maxPitch: 72,
    canvasContextAttributes: { antialias: true }
  })

  let ready = false
  let fellBack = false
  let hasVector = true
  let appliedTheme = initialTheme
  let settleTimer: number | undefined

  const init = () => {
    if (ready) return
    if (hasVector) addBuildingsLayer(map, appliedTheme)
    ready = true
    handlers.onReady(map)
  }

  const switchToRaster = () => {
    if (ready || fellBack) return
    fellBack = true
    hasVector = false
    handlers.onNotice('3D map style unavailable — falling back to standard OSM tiles')
    map.setStyle(RASTER_FALLBACK_STYLE)
    map.once('styledata', () => {
      settleTimer = window.setTimeout(init, STYLE_SETTLE_DELAY_MS)
    })
  }

  map.on('error', (event) => {
    const message = event.error?.message ?? ''
    if (!ready && /style|fetch|403|404|Failed/i.test(message)) switchToRaster()
  })
  map.on('load', init)

  const rasterTimer = window.setTimeout(() => {
    if (!ready) switchToRaster()
  }, RASTER_FALLBACK_TIMEOUT_MS)
  const fatalTimer = window.setTimeout(() => {
    if (!ready && fellBack) {
      handlers.onFatal(
        'Map tiles could not be loaded. Check internet access (openfreemap.org / openstreetmap.org must be reachable).'
      )
    }
  }, FATAL_TIMEOUT_MS)

  return {
    setTheme: (theme) => {
      if (!ready || !hasVector || theme === appliedTheme) return
      appliedTheme = theme
      map.setStyle(vectorStyleUrl(theme))
      map.once('styledata', () => {
        settleTimer = window.setTimeout(() => {
          addBuildingsLayer(map, theme)
          handlers.onStyleReloaded()
        }, STYLE_SETTLE_DELAY_MS)
      })
    },
    dispose: () => {
      window.clearTimeout(rasterTimer)
      window.clearTimeout(fatalTimer)
      window.clearTimeout(settleTimer)
      map.remove()
    }
  }
}

function addBuildingsLayer(map: MaplibreMap, theme: Theme): void {
  try {
    if (map.getLayer(BUILDINGS_LAYER_ID)) map.removeLayer(BUILDINGS_LAYER_ID)
    const vectorSource = Object.entries(map.getStyle().sources).find(
      ([, source]) => source.type === 'vector'
    )
    if (!vectorSource) return
    map.addLayer({
      id: BUILDINGS_LAYER_ID,
      source: vectorSource[0],
      'source-layer': 'building',
      type: 'fill-extrusion',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': BUILDING_COLORS[theme],
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 12],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.88
      }
    })
  } catch {
    // 3D buildings are an enhancement — the demo works without them
  }
}
