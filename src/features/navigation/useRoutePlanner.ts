import { useCallback } from 'react'
import { DEFAULT_START } from '../../data/routes'
import { getCurrentPosition } from '../../services/location/currentPosition'
import { scheduleManeuvers } from '../../services/routing/maneuvers'
import { fetchDrivingRouteDetailed, withExactEndpoints } from '../../services/routing/osrmClient'
import { formatRouteLengthKm } from '../../shared/lib/format'
import type { LngLat } from '../../shared/lib/geo'
import { RouteIndex } from '../../shared/lib/routeIndex'
import { useNavigationStore } from '../../store/navigationStore'
import { useSimulationStore } from '../../store/simulationStore'
import { useToastStore } from '../../store/toastStore'
import { driveSimulator } from '../simulation/DriveSimulator'

export interface NavigationTarget {
  name: string
  coord: LngLat
}

/**
 * The vehicle's current position as a route origin, like Google's "Your location".
 * Never persisted — resolved fresh per route: vehicle position, then live geolocation,
 * then the default start.
 */
export async function yourLocationTarget(): Promise<NavigationTarget> {
  const coord = driveSimulator.position ?? (await getCurrentPosition()) ?? DEFAULT_START
  return { name: 'Your location', coord }
}

/**
 * Fetches a road route between the given endpoints and enters route preview: the journey
 * is framed on the map and driving begins only when the driver presses Start.
 */
export function useRoutePlanner(): (
  origin: NavigationTarget,
  destination: NavigationTarget
) => Promise<void> {
  return useCallback(async (origin, destination) => {
    const toast = useToastStore.getState().show
    toast(`Routing to ${destination.name}…`)
    try {
      const detailed = await fetchDrivingRouteDetailed([origin.coord, destination.coord])
      const coordinates = withExactEndpoints(detailed.coordinates, origin.coord, destination.coord)
      const route = new RouteIndex(coordinates)
      const maneuvers = scheduleManeuvers(route, detailed.maneuvers)
      useSimulationStore.getState().setPlaying(false)
      useSimulationStore.getState().setFreeLook(false)
      // park the vehicle at the chosen starting point right away, not only on Start
      driveSimulator.setRoute(route, { loop: false })
      useNavigationStore
        .getState()
        .previewRoute(origin, destination, coordinates, route.totalLengthM, maneuvers)
      toast(`Route ready · ${formatRouteLengthKm(route.totalLengthM)}`)
    } catch {
      toast('Routing unavailable — check internet access')
    }
  }, [])
}
