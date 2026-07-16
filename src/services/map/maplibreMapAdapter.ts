import type { Map as MaplibreMap } from 'maplibre-gl'
import { LngLatBounds, Marker } from 'maplibre-gl'
import type { CampaignRegion } from '../../data/campaigns'
import { easeInOutCubic } from '../../shared/lib/animation'
import type { LngLat } from '../../shared/lib/geo'
import { circlePolygon, destinationPoint, lerpAngle } from '../../shared/lib/geo'
import type { Theme } from '../../store/settingsStore'
import { useSimulationStore, type ViewMode } from '../../store/simulationStore'
import type { CockpitMapController } from './createCockpitMap'
import { createCockpitMap } from './createCockpitMap'
import type { MapAdapter, MapAdapterHandlers, OfferPinVO, VehiclePose } from './MapAdapter'
import { ROUTE_CASING_COLOR, ROUTE_LINE_COLOR } from './MapAdapter'
import { BUILDINGS_LAYER_ID } from './mapStyles'
import {
  createCampaignPinElement,
  createCarPuckElement,
  createDestinationFlagElement,
  createOfferPinElement,
  setCarPuckMode
} from './markerElements'

const BEARING_SMOOTHING = 0.08
/* Chase distance at the base zoom; halves per zoom step so the car stays on screen. */
const CHASE_AHEAD_BASE_M = 55
const ZOOM_3D = 17.1
const ZOOM_2D = 15.8
const PITCH_3D = 65
const FOLLOW_TRANSITION_MS = 1400
const OVERVIEW_PADDING = { top: 60, bottom: 120, left: 320, right: 70 }

const ROUTE_SOURCE_ID = 'nav-route'
const ROUTE_CASING_LAYER_ID = 'nav-route-casing'
const ROUTE_LINE_LAYER_ID = 'nav-route-line'

interface CameraSnapshot {
  center: LngLat
  zoom: number
  pitch: number
  bearing: number
}

/** MapLibre/OpenFreeMap implementation, used when no Google Maps API key is configured. */
export class MaplibreMapAdapter implements MapAdapter {
  private readonly controller: CockpitMapController
  private readonly carElement = createCarPuckElement()
  private map: MaplibreMap | null = null
  private carMarker: Marker | null = null
  private regions: CampaignRegion[] = []
  private regionMarkers: Marker[] = []
  private regionLayerIds: string[] = []
  private regionSourceIds: string[] = []
  private offerPins: OfferPinVO[] = []
  private offerMarkers: Marker[] = []
  private destinationMarker: Marker | null = null
  private routePath: LngLat[] | null = null
  private cameraBearing = 0
  private lastCamera: CameraSnapshot | null = null
  private transitionFrom: CameraSnapshot | null = null
  private transitionStartMs = 0

  constructor(container: HTMLElement, start: LngLat, theme: Theme, handlers: MapAdapterHandlers) {
    const viewMode = useSimulationStore.getState().viewMode
    this.controller = createCockpitMap(container, start, theme, viewMode, {
      onReady: (map) => {
        this.map = map
        // drag pans the map (entering free-look); wheel zoom stays ours via MapPanel
        map.dragPan.enable()
        map.on('dragstart', () => handlers.onUserPan?.())
        setCarPuckMode(this.carElement, viewMode)
        this.carMarker = new Marker({
          element: this.carElement,
          rotationAlignment: 'map',
          pitchAlignment: 'map'
        })
          .setLngLat(start)
          .addTo(map)
        this.renderRegions()
        this.renderOfferPins()
        this.renderRoutePath()
        handlers.onReady()
      },
      onStyleReloaded: () => {
        this.renderRegions()
        this.renderRoutePath()
      },
      onNotice: handlers.onNotice,
      onFatal: handlers.onFatal
    })
  }

  updateFrame(pose: VehiclePose, viewMode: ViewMode, zoomOffset: number, follow: boolean): void {
    const map = this.map
    if (!map || !this.carMarker) return
    this.carMarker.setLngLat(pose.position)
    this.carMarker.setRotation(pose.bearing)
    setCarPuckMode(this.carElement, viewMode)
    if (!follow) return

    if (this.transitionFrom) {
      const t = (performance.now() - this.transitionStartMs) / FOLLOW_TRANSITION_MS
      if (t >= 1) {
        this.transitionFrom = null
        this.cameraBearing = pose.bearing
      } else {
        const k = easeInOutCubic(t)
        const from = this.transitionFrom
        this.cameraBearing = lerpAngle(from.bearing, pose.bearing, k)
        const target = this.followTarget(pose, viewMode, zoomOffset)
        this.applyCamera({
          center: [
            from.center[0] + (target.center[0] - from.center[0]) * k,
            from.center[1] + (target.center[1] - from.center[1]) * k
          ],
          bearing: this.cameraBearing,
          pitch: from.pitch + (target.pitch - from.pitch) * k,
          zoom: from.zoom + (target.zoom - from.zoom) * k
        })
        this.setBuildingsVisible(viewMode === '3d')
        return
      }
    }

    this.cameraBearing = lerpAngle(this.cameraBearing, pose.bearing, BEARING_SMOOTHING)
    this.applyCamera(this.followTarget(pose, viewMode, zoomOffset))
    this.setBuildingsVisible(viewMode === '3d')
  }

  /**
   * Chase-camera target. The look-ahead offset uses the smoothed camera bearing, not the
   * raw route bearing — the raw bearing jumps at every polyline vertex, which would lurch
   * the camera (and everything on the map) sideways.
   */
  private followTarget(pose: VehiclePose, viewMode: ViewMode, zoomOffset: number): CameraSnapshot {
    if (viewMode === '3d') {
      const chaseAheadM = CHASE_AHEAD_BASE_M * 2 ** -zoomOffset
      return {
        center: destinationPoint(pose.position, chaseAheadM, this.cameraBearing),
        bearing: this.cameraBearing,
        pitch: PITCH_3D,
        zoom: ZOOM_3D + zoomOffset
      }
    }
    return {
      center: pose.position,
      bearing: this.cameraBearing,
      pitch: 0,
      zoom: ZOOM_2D + zoomOffset
    }
  }

  /** Skips camera jumps below numeric noise (paused) while keeping motion continuous. */
  private applyCamera(camera: CameraSnapshot): void {
    const map = this.map
    if (!map) return
    const previous = this.lastCamera
    if (
      previous &&
      Math.abs(previous.center[0] - camera.center[0]) < 1e-8 &&
      Math.abs(previous.center[1] - camera.center[1]) < 1e-8 &&
      Math.abs(previous.bearing - camera.bearing) < 0.005 &&
      Math.abs(previous.pitch - camera.pitch) < 0.01 &&
      Math.abs(previous.zoom - camera.zoom) < 0.001
    ) {
      return
    }
    this.lastCamera = camera
    map.jumpTo({
      center: camera.center,
      bearing: camera.bearing,
      pitch: camera.pitch,
      zoom: camera.zoom
    })
  }

  setCampaignRegions(regions: CampaignRegion[]): void {
    this.regions = regions
    this.renderRegions()
  }

  setOfferPins(pins: OfferPinVO[]): void {
    this.offerPins = pins
    this.renderOfferPins()
  }

  setDestination(coord: LngLat | null): void {
    this.destinationMarker?.remove()
    this.destinationMarker = null
    if (!coord || !this.map) return
    this.destinationMarker = new Marker({ element: createDestinationFlagElement() })
      .setLngLat(coord)
      .addTo(this.map)
  }

  setRoutePath(coordinates: LngLat[] | null): void {
    this.routePath = coordinates
    this.renderRoutePath()
  }

  nudgeZoom(delta: number): void {
    const map = this.map
    if (!map) return
    map.easeTo({ zoom: map.getZoom() + delta, duration: 200 })
    this.lastCamera = null
  }

  frameRouteOverview(coordinates: LngLat[]): void {
    const map = this.map
    if (!map || coordinates.length === 0) return
    let bounds = new LngLatBounds(coordinates[0], coordinates[0])
    for (const coordinate of coordinates) bounds = bounds.extend(coordinate)
    map.fitBounds(bounds, {
      padding: OVERVIEW_PADDING,
      pitch: 0,
      bearing: 0,
      duration: FOLLOW_TRANSITION_MS
    })
  }

  beginFollowTransition(): void {
    const map = this.map
    if (!map) return
    const center = map.getCenter()
    this.transitionFrom = {
      center: [center.lng, center.lat],
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing()
    }
    this.transitionStartMs = performance.now()
  }

  setTheme(theme: Theme): void {
    this.controller.setTheme(theme)
  }

  dispose(): void {
    this.clearRegions()
    this.clearOfferPins()
    this.destinationMarker?.remove()
    this.carMarker?.remove()
    this.controller.dispose()
  }

  private renderRoutePath(): void {
    const map = this.map
    if (!map) return
    try {
      if (map.getLayer(ROUTE_LINE_LAYER_ID)) map.removeLayer(ROUTE_LINE_LAYER_ID)
      if (map.getLayer(ROUTE_CASING_LAYER_ID)) map.removeLayer(ROUTE_CASING_LAYER_ID)
      if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID)
      if (!this.routePath) return
      map.addSource(ROUTE_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: this.routePath }
        }
      })
      map.addLayer({
        id: ROUTE_CASING_LAYER_ID,
        source: ROUTE_SOURCE_ID,
        type: 'line',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ROUTE_CASING_COLOR, 'line-width': 9, 'line-opacity': 0.9 }
      })
      map.addLayer({
        id: ROUTE_LINE_LAYER_ID,
        source: ROUTE_SOURCE_ID,
        type: 'line',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ROUTE_LINE_COLOR, 'line-width': 5.5 }
      })
    } catch {
      // the style may be mid-swap; onStyleReloaded will re-render
    }
  }

  private renderRegions(): void {
    this.clearRegions()
    const map = this.map
    if (!map || this.regions.length === 0) return
    try {
      for (const region of this.regions) {
        const sourceId = `geofence-${region.id}`
        const fillId = `geofence-fill-${region.id}`
        const lineId = `geofence-line-${region.id}`
        map.addSource(sourceId, {
          type: 'geojson',
          data: circlePolygon(region.center, region.radiusM)
        })
        map.addLayer({
          id: fillId,
          source: sourceId,
          type: 'fill',
          paint: { 'fill-color': region.color, 'fill-opacity': 0.12 }
        })
        map.addLayer({
          id: lineId,
          source: sourceId,
          type: 'line',
          paint: { 'line-color': region.color, 'line-width': 2, 'line-dasharray': [2, 1.5] }
        })
        this.regionSourceIds.push(sourceId)
        this.regionLayerIds.push(fillId, lineId)
        this.regionMarkers.push(
          new Marker({ element: createCampaignPinElement(region), anchor: 'bottom' })
            .setLngLat(region.center)
            .addTo(map)
        )
      }
    } catch {
      // the style may be mid-swap; onStyleReloaded will re-render
    }
  }

  private clearRegions(): void {
    for (const marker of this.regionMarkers) marker.remove()
    this.regionMarkers = []
    const map = this.map
    if (map) {
      try {
        for (const layerId of this.regionLayerIds)
          if (map.getLayer(layerId)) map.removeLayer(layerId)
        for (const sourceId of this.regionSourceIds)
          if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch {
        // the map may already have been disposed during teardown
      }
    }
    this.regionLayerIds = []
    this.regionSourceIds = []
  }

  /* markers are DOM overlays: unlike layers they survive base-style swaps untouched */
  private renderOfferPins(): void {
    this.clearOfferPins()
    const map = this.map
    if (!map || this.offerPins.length === 0) return
    for (const pin of this.offerPins) {
      const element = createOfferPinElement(pin.imageUrl, pin.name)
      element.addEventListener('click', pin.onSelect)
      this.offerMarkers.push(
        new Marker({ element, anchor: 'bottom' }).setLngLat(pin.coord).addTo(map)
      )
    }
  }

  private clearOfferPins(): void {
    for (const marker of this.offerMarkers) marker.remove()
    this.offerMarkers = []
  }

  private setBuildingsVisible(visible: boolean): void {
    const map = this.map
    if (!map?.getLayer(BUILDINGS_LAYER_ID)) return
    map.setLayoutProperty(BUILDINGS_LAYER_ID, 'visibility', visible ? 'visible' : 'none')
  }
}
