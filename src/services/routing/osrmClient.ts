import type { LngLat } from '../../shared/lib/geo'
import { haversineDistance } from '../../shared/lib/geo'

const OSRM_ENDPOINT = 'https://router.project-osrm.org/route/v1/driving'
const SNAP_TOLERANCE_M = 3

export interface RouteManeuver {
  location: LngLat
  type: string
  modifier?: string
  name: string
}

export interface DrivingRoute {
  coordinates: LngLat[]
  maneuvers: RouteManeuver[]
}

interface OsrmStep {
  name: string
  maneuver: { location: LngLat; type: string; modifier?: string }
}

interface OsrmResponse {
  routes: { geometry: { coordinates: LngLat[] }; legs?: { steps: OsrmStep[] }[] }[]
}

/** Road-snapped driving route through `waypoints` via the public OSRM API. */
export async function fetchDrivingRoute(waypoints: LngLat[]): Promise<LngLat[]> {
  const coordinatePath = waypoints.map((waypoint) => waypoint.join(',')).join(';')
  const url = `${OSRM_ENDPOINT}/${coordinatePath}?overview=full&geometries=geojson&continue_straight=true`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Routing request failed with status ${response.status}`)
  const body = (await response.json()) as OsrmResponse
  const route = body.routes[0]
  if (!route) throw new Error('Routing response contained no routes')
  return route.geometry.coordinates
}

/** Road-snapped driving route including turn-by-turn maneuvers. */
export async function fetchDrivingRouteDetailed(waypoints: LngLat[]): Promise<DrivingRoute> {
  const coordinatePath = waypoints.map((waypoint) => waypoint.join(',')).join(';')
  const url = `${OSRM_ENDPOINT}/${coordinatePath}?overview=full&geometries=geojson&continue_straight=true&steps=true`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Routing request failed with status ${response.status}`)
  const body = (await response.json()) as OsrmResponse
  const route = body.routes[0]
  if (!route) throw new Error('Routing response contained no routes')
  const maneuvers = (route.legs ?? [])
    .flatMap((leg) => leg.steps)
    .map((step) => ({
      location: step.maneuver.location,
      type: step.maneuver.type,
      modifier: step.maneuver.modifier,
      name: step.name
    }))
  return { coordinates: route.geometry.coordinates, maneuvers }
}

/**
 * OSRM snaps route endpoints onto the road network; this pins the exact requested
 * endpoints back onto the route so the vehicle rests precisely where configured.
 */
export function withExactEndpoints(coordinates: LngLat[], start: LngLat, end?: LngLat): LngLat[] {
  const result = [...coordinates]
  if (result.length > 0 && haversineDistance(start, result[0]) > SNAP_TOLERANCE_M) {
    result.unshift(start)
  }
  if (
    end &&
    result.length > 0 &&
    haversineDistance(end, result[result.length - 1]) > SNAP_TOLERANCE_M
  ) {
    result.push(end)
  }
  return result
}

/** Straight-line interpolation between waypoints, used when OSRM is unreachable. */
export function buildStraightLineRoute(waypoints: LngLat[], stepsPerLeg = 24): LngLat[] {
  const coordinates: LngLat[] = []
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i]
    const b = waypoints[i + 1]
    for (let step = 0; step < stepsPerLeg; step++) {
      coordinates.push([
        a[0] + ((b[0] - a[0]) * step) / stepsPerLeg,
        a[1] + ((b[1] - a[1]) * step) / stepsPerLeg
      ])
    }
  }
  coordinates.push(waypoints[waypoints.length - 1])
  return coordinates
}
