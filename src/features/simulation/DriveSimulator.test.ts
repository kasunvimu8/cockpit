import { expect, test } from 'vitest'
import type { LngLat } from '../../shared/lib/geo'
import { RouteIndex } from '../../shared/lib/routeIndex'
import { ARRIVAL_BUFFER_M, DriveSimulator } from './DriveSimulator'

const START: LngLat = [11.57, 48.13]
const END: LngLat = [11.57, 48.14]
const ROUTE = new RouteIndex([START, END])

test('advance moves the vehicle according to speed and elapsed time', () => {
  const simulator = new DriveSimulator()
  simulator.setRoute(ROUTE, { loop: false })
  const start = simulator.snapshot()
  const moved = simulator.advance(36, 10)
  expect(start).not.toBeNull()
  expect(moved).not.toBeNull()
  expect(moved?.position[1]).toBeGreaterThan(start?.position[1] ?? Number.POSITIVE_INFINITY)
  expect(moved?.arrived).toBe(false)
})

test('advance wraps around on loop routes', () => {
  const simulator = new DriveSimulator()
  simulator.setRoute(ROUTE, { loop: true })
  const snapshot = simulator.advance(3600, ROUTE.totalLengthM / 1000 + 0.05)
  expect(snapshot?.arrived).toBe(false)
  expect(snapshot?.position[1]).toBeLessThan(48.1305)
})

test('advance clamps and reports arrival on one-way routes', () => {
  const simulator = new DriveSimulator()
  simulator.setRoute(ROUTE, { loop: false })
  const snapshot = simulator.advance(3600, ROUTE.totalLengthM)
  expect(snapshot?.arrived).toBe(true)
  const end = ROUTE.pointAt(ROUTE.totalLengthM - ARRIVAL_BUFFER_M)
  expect(snapshot?.position[1]).toBeCloseTo(end.position[1], 8)
})

test('setRoute resets progress', () => {
  const simulator = new DriveSimulator()
  simulator.setRoute(ROUTE, { loop: false })
  simulator.advance(100, 10)
  simulator.setRoute(ROUTE, { loop: false })
  expect(simulator.snapshot()?.position[1]).toBeCloseTo(START[1], 6)
})

test('advance returns null without a route', () => {
  expect(new DriveSimulator().advance(50, 1)).toBeNull()
})
