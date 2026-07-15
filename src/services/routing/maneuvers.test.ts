import { expect, test } from 'vitest'
import type { LngLat } from '../../shared/lib/geo'
import { RouteIndex } from '../../shared/lib/routeIndex'
import { maneuverKind, scheduleManeuvers } from './maneuvers'

test('maneuverKind maps OSRM types and modifiers', () => {
  expect(maneuverKind('depart', 'left')).toBeNull()
  expect(maneuverKind('arrive')).toBe('arrive')
  expect(maneuverKind('turn', 'left')).toBe('left')
  expect(maneuverKind('turn', 'slight right')).toBe('slight-right')
  expect(maneuverKind('roundabout', 'right')).toBe('roundabout')
  expect(maneuverKind('new name', undefined)).toBe('straight')
})

test('scheduleManeuvers anchors maneuvers to distances along the route', () => {
  const A: LngLat = [11.57, 48.13]
  const B: LngLat = [11.57, 48.14]
  const C: LngLat = [11.58, 48.14]
  const route = new RouteIndex([A, B, C])
  const scheduled = scheduleManeuvers(route, [
    { location: C, type: 'arrive', name: 'Ziel' },
    { location: B, type: 'turn', modifier: 'right', name: 'Teststraße' },
    { location: A, type: 'depart', modifier: 'straight', name: '' }
  ])
  expect(scheduled).toHaveLength(2)
  expect(scheduled[0].kind).toBe('right')
  expect(scheduled[0].name).toBe('Teststraße')
  expect(scheduled[0].atM).toBeCloseTo(route.distanceAt(1), 6)
  expect(scheduled[1].kind).toBe('arrive')
  expect(scheduled[1].atM).toBeCloseTo(route.totalLengthM, 6)
})
