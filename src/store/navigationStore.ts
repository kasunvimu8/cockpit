import { create } from 'zustand'
import type { ManeuverKind, ScheduledManeuver } from '../services/routing/maneuvers'
import type { LngLat } from '../shared/lib/geo'

export type NavigationPhase = 'idle' | 'preview' | 'navigating'

export interface ActiveDestination {
  name: string
  coord: LngLat
}

export interface GuidanceManeuver {
  kind: ManeuverKind
  name: string
  inM: number
}

interface NavigationState {
  phase: NavigationPhase
  origin: ActiveDestination | null
  destination: ActiveDestination | null
  routeCoordinates: LngLat[] | null
  routeLengthM: number
  maneuvers: ScheduledManeuver[]
  /** Live guidance values, updated by the simulation loop while navigating. */
  remainingM: number
  nextManeuver: GuidanceManeuver | null
  /** Enters route preview: journey shown on the map, waiting for the driver to start. */
  previewRoute: (
    origin: ActiveDestination,
    destination: ActiveDestination,
    coordinates: LngLat[],
    lengthM: number,
    maneuvers: ScheduledManeuver[]
  ) => void
  startNavigation: () => void
  /** Ends guidance (arrival or cancel): clears the route line and endpoints. */
  endNavigation: () => void
  updateGuidance: (remainingM: number, nextManeuver: GuidanceManeuver | null) => void
}

export const useNavigationStore = create<NavigationState>()((set, get) => ({
  phase: 'idle',
  origin: null,
  destination: null,
  routeCoordinates: null,
  routeLengthM: 0,
  maneuvers: [],
  remainingM: 0,
  nextManeuver: null,
  previewRoute: (origin, destination, routeCoordinates, routeLengthM, maneuvers) =>
    set({
      phase: 'preview',
      origin,
      destination,
      routeCoordinates,
      routeLengthM,
      maneuvers,
      remainingM: routeLengthM,
      nextManeuver: null
    }),
  startNavigation: () => set({ phase: 'navigating' }),
  endNavigation: () =>
    set({
      phase: 'idle',
      origin: null,
      destination: null,
      routeCoordinates: null,
      routeLengthM: 0,
      maneuvers: [],
      remainingM: 0,
      nextManeuver: null
    }),
  updateGuidance: (remainingM, nextManeuver) => {
    const state = get()
    const sameManeuver =
      state.nextManeuver === nextManeuver ||
      (state.nextManeuver !== null &&
        nextManeuver !== null &&
        state.nextManeuver.kind === nextManeuver.kind &&
        state.nextManeuver.name === nextManeuver.name &&
        state.nextManeuver.inM === nextManeuver.inM)
    if (state.remainingM === remainingM && sameManeuver) return
    set({ remainingM, nextManeuver })
  }
}))
