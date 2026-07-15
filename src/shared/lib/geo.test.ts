import { expect, test } from 'vitest'
import type { LngLat } from './geo'
import {
  bearingBetween,
  circlePolygon,
  destinationPoint,
  haversineDistance,
  lerpAngle
} from './geo'

test('haversineDistance returns ~111 km for one degree of latitude', () => {
  const distance = haversineDistance([11.57, 48], [11.57, 49])
  expect(distance).toBeGreaterThan(110000)
  expect(distance).toBeLessThan(112500)
})

test('bearingBetween points north and east', () => {
  expect(bearingBetween([11.57, 48.1], [11.57, 48.2])).toBeCloseTo(0, 5)
  expect(bearingBetween([11.57, 48.1], [11.6, 48.1])).toBeCloseTo(90, 0)
})

test('destinationPoint travels the requested distance', () => {
  const origin: LngLat = [11.5754, 48.1372]
  const target = destinationPoint(origin, 500, 45)
  expect(haversineDistance(origin, target)).toBeCloseTo(500, 0)
})

test('circlePolygon builds a closed ring of points on the radius', () => {
  const center: LngLat = [11.5754, 48.1372]
  const circle = circlePolygon(center, 120, 32)
  const ring = circle.geometry.coordinates[0]
  expect(ring).toHaveLength(33)
  expect(ring[0][0]).toBeCloseTo(ring[32][0], 8)
  expect(ring[0][1]).toBeCloseTo(ring[32][1], 8)
  for (const point of ring) {
    expect(haversineDistance(center, point as LngLat)).toBeCloseTo(120, 0)
  }
})

test('lerpAngle interpolates across the 0/360 wrap', () => {
  expect(lerpAngle(350, 10, 0.5)).toBeCloseTo(0, 5)
  expect(lerpAngle(10, 350, 0.5)).toBeCloseTo(0, 5)
  expect(lerpAngle(0, 90, 0.5)).toBeCloseTo(45, 5)
})
