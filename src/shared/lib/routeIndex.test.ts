import { expect, test } from 'vitest'
import type { LngLat } from './geo'
import { haversineDistance } from './geo'
import { RouteIndex } from './routeIndex'

const A: LngLat = [11.57, 48.13]
const B: LngLat = [11.57, 48.14]
const C: LngLat = [11.58, 48.14]

test('totalLengthM sums the segment distances', () => {
  const route = new RouteIndex([A, B, C])
  expect(route.totalLengthM).toBeCloseTo(haversineDistance(A, B) + haversineDistance(B, C), 6)
})

test('pointAt interpolates along a segment', () => {
  const route = new RouteIndex([A, B])
  const halfway = route.pointAt(route.totalLengthM / 2)
  expect(halfway.position[0]).toBeCloseTo(11.57, 8)
  expect(halfway.position[1]).toBeCloseTo(48.135, 4)
  expect(halfway.bearing).toBeCloseTo(0, 5)
})

test('pointAt clamps distances outside the route', () => {
  const route = new RouteIndex([A, B])
  expect(route.pointAt(-50).position[1]).toBeCloseTo(A[1], 6)
  expect(route.pointAt(route.totalLengthM + 500).position[1]).toBeCloseTo(B[1], 4)
})

test('constructor rejects degenerate routes', () => {
  expect(() => new RouteIndex([A])).toThrow()
})
