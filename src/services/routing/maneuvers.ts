import { haversineDistance } from '../../shared/lib/geo'
import type { RouteIndex } from '../../shared/lib/routeIndex'
import type { RouteManeuver } from './osrmClient'

export type ManeuverKind =
  | 'straight'
  | 'left'
  | 'right'
  | 'slight-left'
  | 'slight-right'
  | 'sharp-left'
  | 'sharp-right'
  | 'uturn'
  | 'roundabout'
  | 'arrive'

/** A maneuver anchored to its cumulative distance along the driven route. */
export interface ScheduledManeuver {
  atM: number
  kind: ManeuverKind
  name: string
}

/** Maps OSRM maneuver type/modifier to a display kind; null for maneuvers to skip. */
export function maneuverKind(type: string, modifier?: string): ManeuverKind | null {
  if (type === 'depart') return null
  if (type === 'arrive') return 'arrive'
  if (type === 'roundabout' || type === 'rotary' || type === 'roundabout turn') return 'roundabout'
  switch (modifier) {
    case 'left':
      return 'left'
    case 'right':
      return 'right'
    case 'slight left':
      return 'slight-left'
    case 'slight right':
      return 'slight-right'
    case 'sharp left':
      return 'sharp-left'
    case 'sharp right':
      return 'sharp-right'
    case 'uturn':
      return 'uturn'
    default:
      return 'straight'
  }
}

/** Anchors OSRM maneuvers to distances along the final (endpoint-pinned) route. */
export function scheduleManeuvers(
  route: RouteIndex,
  maneuvers: RouteManeuver[]
): ScheduledManeuver[] {
  const scheduled: ScheduledManeuver[] = []
  for (const maneuver of maneuvers) {
    const kind = maneuverKind(maneuver.type, maneuver.modifier)
    if (!kind) continue
    let bestIndex = 0
    let bestDistance = Number.POSITIVE_INFINITY
    for (let index = 0; index < route.coordinates.length; index++) {
      const distance = haversineDistance(route.coordinates[index], maneuver.location)
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    }
    scheduled.push({ atM: route.distanceAt(bestIndex), kind, name: maneuver.name })
  }
  return scheduled.sort((a, b) => a.atM - b.atM)
}
