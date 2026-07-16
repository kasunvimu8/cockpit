import type { CampaignRegion } from '../../data/campaigns'
import type { LngLat } from '../../shared/lib/geo'
import type { Theme } from '../../store/settingsStore'
import type { ViewMode } from '../../store/simulationStore'

export interface VehiclePose {
  position: LngLat
  bearing: number
}

/** A branded-pin ad offer rendered on the map; `onSelect` opens its details screen. */
export interface OfferPinVO {
  id: string
  coord: LngLat
  imageUrl: string | null
  onSelect: () => void
}

export const ROUTE_LINE_COLOR = '#7aaefb'
export const ROUTE_CASING_COLOR = '#ffffff'

/**
 * Provider-independent surface for everything the cockpit needs from a map: per-frame
 * vehicle/camera updates, campaign geofences, route guidance and theming.
 */
export interface MapAdapter {
  /** Called every animation frame; moves the vehicle marker and, when `follow`, the camera. */
  updateFrame(pose: VehiclePose, viewMode: ViewMode, zoomOffset: number, follow: boolean): void
  /** Replaces the rendered campaign regions (circle + pin per region). */
  setCampaignRegions(regions: CampaignRegion[]): void
  /** Replaces the rendered branded-pin ad offers. */
  setOfferPins(pins: OfferPinVO[]): void
  /** Shows the destination flag, or removes it when null. */
  setDestination(coord: LngLat | null): void
  /** Draws the guidance polyline for the journey, or removes it when null. */
  setRoutePath(coordinates: LngLat[] | null): void
  /** Animates the camera out to a top-down overview framing the whole journey. */
  frameRouteOverview(coordinates: LngLat[]): void
  /** Zooms the current view directly — used while the follow camera is suspended. */
  nudgeZoom(delta: number): void
  /** Smoothly animates from the current camera back into the follow/chase view. */
  beginFollowTransition(): void
  setTheme(theme: Theme): void
  dispose(): void
}

export interface MapAdapterHandlers {
  onReady: () => void
  onNotice: (message: string) => void
  onFatal: (message: string) => void
  /** Fired when the underlying map was recreated and the view state must be restored. */
  onViewReset?: () => void
  /** Fired when the user starts panning the map by hand. */
  onUserPan?: () => void
}
