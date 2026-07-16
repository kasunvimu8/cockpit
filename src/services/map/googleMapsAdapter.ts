import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import type { CampaignRegion } from '../../data/campaigns'
import { easeInOutCubic } from '../../shared/lib/animation'
import type { LngLat } from '../../shared/lib/geo'
import { destinationPoint, haversineDistance, lerpAngle } from '../../shared/lib/geo'
import type { Theme } from '../../store/settingsStore'
import { useSimulationStore, type ViewMode } from '../../store/simulationStore'
import type { MapAdapter, MapAdapterHandlers, OfferPinVO, VehiclePose } from './MapAdapter'
import { ROUTE_CASING_COLOR, ROUTE_LINE_COLOR } from './MapAdapter'
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID } from './mapProvider'
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
/* Google zoom levels are one step above MapLibre's for the same visual scale. */
const ZOOM_3D = 18.1
/* Kept below ~16.75, where Google's vector style starts extruding 3D buildings — the
   2D view must render the flat cartographic style. */
const ZOOM_2D = 16.4
const TILT_3D = 65
const FOLLOW_TRANSITION_MS = 1400
const OVERVIEW_PADDING = { top: 60, bottom: 120, left: 320, right: 70 }

const toLatLng = (coord: LngLat): google.maps.LatLngLiteral => ({ lat: coord[1], lng: coord[0] })

let loaderConfigured = false

function configureLoaderOnce(): void {
  if (loaderConfigured) return
  loaderConfigured = true
  setOptions({ key: GOOGLE_MAPS_API_KEY, v: 'weekly' })
}

interface CameraSnapshot {
  center: LngLat
  zoom: number
  tilt: number
  heading: number
}

/**
 * Google Maps implementation: one vector map serves both views — tilted with 3D buildings
 * in 3D mode, top-down in 2D mode. The map is recreated on theme change because Google's
 * colour scheme is fixed at construction time.
 */
export class GoogleMapsAdapter implements MapAdapter {
  private readonly container: HTMLElement
  private readonly handlers: MapAdapterHandlers
  private readonly carElement = createCarPuckElement()
  private map: google.maps.Map | null = null
  private markerLib: google.maps.MarkerLibrary | null = null
  private carMarker: google.maps.marker.AdvancedMarkerElement | null = null
  private carRotator: HTMLElement | null = null
  private circles: google.maps.Circle[] = []
  private pins: google.maps.marker.AdvancedMarkerElement[] = []
  private offerMarkers: google.maps.marker.AdvancedMarkerElement[] = []
  private destinationMarker: google.maps.marker.AdvancedMarkerElement | null = null
  private routeLines: google.maps.Polyline[] = []
  private regions: CampaignRegion[] = []
  private offerPins: OfferPinVO[] = []
  private destination: LngLat | null = null
  private routePath: LngLat[] | null = null
  private theme: Theme
  private lastPose: VehiclePose
  private cameraBearing = 0
  private lastCamera: CameraSnapshot | null = null
  private transitionFrom: CameraSnapshot | null = null
  private transitionStartMs = 0
  private disposed = false

  constructor(container: HTMLElement, start: LngLat, theme: Theme, handlers: MapAdapterHandlers) {
    this.container = container
    this.theme = theme
    this.handlers = handlers
    this.lastPose = { position: start, bearing: 0 }
    this.boot()
  }

  private async boot(): Promise<void> {
    try {
      configureLoaderOnce()
      await importLibrary('maps')
      this.markerLib = await importLibrary('marker')
      ;(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
        if (this.disposed) return
        this.handlers.onFatal(
          'Google Maps rejected the API key (missing referrer or API permission) — check VITE_GOOGLE_MAPS_API_KEY in .env.local.'
        )
      }
      if (this.disposed) return
      this.createMap()
      this.handlers.onReady()
    } catch {
      if (this.disposed) return
      this.handlers.onFatal(
        'Google Maps failed to load — check the API key in .env.local and network access.'
      )
    }
  }

  private createMap(): void {
    if (!this.markerLib) return
    this.container.replaceChildren()
    // build the map in the persisted view mode so it never loads tilted then flips flat
    const viewMode = useSimulationStore.getState().viewMode
    const is3d = viewMode === '3d'
    this.map = new google.maps.Map(this.container, {
      center: toLatLng(this.lastPose.position),
      zoom: is3d ? ZOOM_3D : ZOOM_2D,
      heading: this.cameraBearing,
      tilt: is3d ? TILT_3D : 0,
      mapId: GOOGLE_MAPS_MAP_ID,
      // vector rendering is required for tilt/heading — raster silently ignores them
      renderingType: 'VECTOR' as google.maps.RenderingType,
      disableDefaultUI: true,
      keyboardShortcuts: false,
      // drag pans the map (entering free-look); wheel zoom stays ours via MapPanel
      gestureHandling: 'greedy',
      scrollwheel: false,
      disableDoubleClickZoom: true,
      colorScheme: (this.theme === 'dark' ? 'DARK' : 'LIGHT') as google.maps.ColorScheme,
      backgroundColor: this.theme === 'dark' ? '#0b0e13' : '#e9eaee'
    })
    this.map.addListener('dragstart', () => this.handlers.onUserPan?.())

    const rotator = document.createElement('div')
    rotator.appendChild(this.carElement)
    const anchor = document.createElement('div')
    anchor.style.transform = 'translateY(50%)'
    anchor.appendChild(rotator)
    this.carRotator = rotator
    this.carMarker = new this.markerLib.AdvancedMarkerElement({
      map: this.map,
      position: toLatLng(this.lastPose.position),
      content: anchor,
      zIndex: 30,
      collisionBehavior: 'REQUIRED' as google.maps.CollisionBehavior
    })
    setCarPuckMode(this.carElement, viewMode)

    this.renderRegions()
    this.renderOfferPins()
    this.renderDestination()
    this.renderRoutePath()
    this.lastCamera = null
    this.handlers.onViewReset?.()
  }

  nudgeZoom(delta: number): void {
    const map = this.map
    if (!map) return
    const zoom = map.getZoom()
    if (zoom === undefined) return
    map.moveCamera({ zoom: zoom + delta })
    this.lastCamera = null
  }

  updateFrame(pose: VehiclePose, viewMode: ViewMode, zoomOffset: number, follow: boolean): void {
    this.lastPose = pose
    const map = this.map
    if (!map || !this.carMarker || !this.carRotator) return

    const previousPosition = this.carMarker.position as google.maps.LatLngLiteral | null
    if (
      !previousPosition ||
      previousPosition.lat !== pose.position[1] ||
      previousPosition.lng !== pose.position[0]
    ) {
      this.carMarker.position = toLatLng(pose.position)
    }
    setCarPuckMode(this.carElement, viewMode)
    // rotate against the heading the map actually applied (0 on a raster fallback)
    const mapHeading = map.getHeading() ?? 0
    const markerRotation =
      Math.round(((((pose.bearing - mapHeading) % 360) + 360) % 360) * 100) / 100
    const transform = `rotate(${markerRotation}deg)`
    if (this.carRotator.style.transform !== transform) this.carRotator.style.transform = transform
    if (!follow) return

    if (this.transitionFrom) {
      const t = (performance.now() - this.transitionStartMs) / FOLLOW_TRANSITION_MS
      if (t >= 1) {
        this.transitionFrom = null
        this.cameraBearing = pose.bearing
      } else {
        const k = easeInOutCubic(t)
        const from = this.transitionFrom
        this.cameraBearing = lerpAngle(from.heading, pose.bearing, k)
        const target = this.followTarget(pose, viewMode, zoomOffset)
        this.applyCamera({
          center: [
            from.center[0] + (target.center[0] - from.center[0]) * k,
            from.center[1] + (target.center[1] - from.center[1]) * k
          ],
          heading: this.cameraBearing,
          tilt: from.tilt + (target.tilt - from.tilt) * k,
          zoom: from.zoom + (target.zoom - from.zoom) * k
        })
        return
      }
    }

    this.cameraBearing = lerpAngle(this.cameraBearing, pose.bearing, BEARING_SMOOTHING)
    this.applyCamera(this.followTarget(pose, viewMode, zoomOffset))
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
        heading: this.cameraBearing,
        tilt: TILT_3D,
        zoom: ZOOM_3D + zoomOffset
      }
    }
    return {
      center: pose.position,
      heading: this.cameraBearing,
      tilt: 0,
      zoom: ZOOM_2D + zoomOffset
    }
  }

  /**
   * Issues a camera move only when something changed beyond numeric noise. Redundant
   * per-frame moveCamera calls make the basemap re-run icon collision passes (flicker
   * while paused), but the thresholds stay tiny so motion remains perfectly continuous.
   */
  private applyCamera(camera: CameraSnapshot): void {
    if (!this.map) return
    const previous = this.lastCamera
    if (
      previous &&
      haversineDistance(previous.center, camera.center) < 0.01 &&
      Math.abs(previous.heading - camera.heading) < 0.005 &&
      Math.abs(previous.tilt - camera.tilt) < 0.01 &&
      Math.abs(previous.zoom - camera.zoom) < 0.001
    ) {
      return
    }
    this.lastCamera = camera
    this.map.moveCamera({
      center: toLatLng(camera.center),
      heading: camera.heading,
      tilt: camera.tilt,
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
    this.destination = coord
    this.renderDestination()
  }

  setRoutePath(coordinates: LngLat[] | null): void {
    this.routePath = coordinates
    this.renderRoutePath()
  }

  frameRouteOverview(coordinates: LngLat[]): void {
    const map = this.map
    if (!map || coordinates.length === 0) return
    const bounds = new google.maps.LatLngBounds()
    for (const coordinate of coordinates) bounds.extend(toLatLng(coordinate))
    map.moveCamera({ tilt: 0, heading: 0 })
    map.fitBounds(bounds, OVERVIEW_PADDING)
  }

  beginFollowTransition(): void {
    const map = this.map
    if (!map) return
    const center = map.getCenter()
    if (!center) return
    this.transitionFrom = {
      center: [center.lng(), center.lat()],
      zoom: map.getZoom() ?? ZOOM_3D,
      tilt: map.getTilt() ?? 0,
      heading: map.getHeading() ?? 0
    }
    this.transitionStartMs = performance.now()
  }

  setTheme(theme: Theme): void {
    if (theme === this.theme) return
    this.theme = theme
    if (this.map) this.createMap()
  }

  dispose(): void {
    this.disposed = true
    this.clearRegions()
    this.clearOfferPins()
    this.clearRouteLines()
    if (this.destinationMarker) this.destinationMarker.map = null
    if (this.carMarker) this.carMarker.map = null
    this.map = null
    this.container.replaceChildren()
  }

  private renderRoutePath(): void {
    this.clearRouteLines()
    const map = this.map
    if (!map || !this.routePath) return
    const path = this.routePath.map(toLatLng)
    this.routeLines.push(
      new google.maps.Polyline({
        map,
        path,
        strokeColor: ROUTE_CASING_COLOR,
        strokeWeight: 9,
        strokeOpacity: 0.9,
        zIndex: 1
      }),
      new google.maps.Polyline({
        map,
        path,
        strokeColor: ROUTE_LINE_COLOR,
        strokeWeight: 5.5,
        strokeOpacity: 1,
        zIndex: 2
      })
    )
  }

  private clearRouteLines(): void {
    for (const line of this.routeLines) line.setMap(null)
    this.routeLines = []
  }

  private renderRegions(): void {
    this.clearRegions()
    const map = this.map
    if (!map || !this.markerLib || this.regions.length === 0) return
    for (const region of this.regions) {
      this.circles.push(
        new google.maps.Circle({
          map,
          center: toLatLng(region.center),
          radius: region.radiusM,
          strokeColor: region.color,
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: region.color,
          fillOpacity: 0.12
        })
      )
      this.pins.push(
        new this.markerLib.AdvancedMarkerElement({
          map,
          position: toLatLng(region.center),
          content: createCampaignPinElement(region),
          zIndex: 10,
          collisionBehavior: 'REQUIRED' as google.maps.CollisionBehavior
        })
      )
    }
  }

  private clearRegions(): void {
    for (const circle of this.circles) circle.setMap(null)
    for (const pin of this.pins) pin.map = null
    this.circles = []
    this.pins = []
  }

  private renderOfferPins(): void {
    this.clearOfferPins()
    const map = this.map
    if (!map || !this.markerLib || this.offerPins.length === 0) return
    for (const pin of this.offerPins) {
      const marker = new this.markerLib.AdvancedMarkerElement({
        map,
        position: toLatLng(pin.coord),
        content: createOfferPinElement(pin.imageUrl),
        zIndex: 15,
        gmpClickable: true,
        collisionBehavior: 'REQUIRED' as google.maps.CollisionBehavior
      })
      marker.addListener('click', pin.onSelect)
      this.offerMarkers.push(marker)
    }
  }

  private clearOfferPins(): void {
    for (const marker of this.offerMarkers) marker.map = null
    this.offerMarkers = []
  }

  private renderDestination(): void {
    if (this.destinationMarker) {
      this.destinationMarker.map = null
      this.destinationMarker = null
    }
    if (!this.destination || !this.map || !this.markerLib) return
    const anchor = document.createElement('div')
    anchor.style.transform = 'translateY(50%)'
    anchor.appendChild(createDestinationFlagElement())
    this.destinationMarker = new this.markerLib.AdvancedMarkerElement({
      map: this.map,
      position: toLatLng(this.destination),
      content: anchor,
      zIndex: 20,
      collisionBehavior: 'REQUIRED' as google.maps.CollisionBehavior
    })
  }
}
