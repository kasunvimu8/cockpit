import { expect, test } from 'vitest'
import type { CampaignRegion } from '../../data/campaigns'
import { destinationPoint } from '../../shared/lib/geo'
import { buildNextRegionLabel, GeofenceTracker } from './geofencing'

const region: CampaignRegion = {
  id: 'test-cafe',
  routeFraction: 0.25,
  radiusM: 100,
  name: 'Test Café',
  tag: 'Food & drink',
  icon: '☕',
  offerTitle: '−20%',
  offerDescription: 'Test offer',
  color: '#0ea5a0',
  center: [11.5754, 48.1372]
}

const inside = region.center
const outside = destinationPoint(region.center, 500, 0)

test('evaluate emits enter once while the vehicle stays inside', () => {
  const tracker = new GeofenceTracker()
  expect(tracker.evaluate(inside, [region]).entered).toHaveLength(1)
  expect(tracker.evaluate(inside, [region]).entered).toHaveLength(0)
})

test('evaluate emits exit when the vehicle leaves', () => {
  const tracker = new GeofenceTracker()
  tracker.evaluate(inside, [region])
  const result = tracker.evaluate(outside, [region])
  expect(result.exited).toHaveLength(1)
  expect(result.entered).toHaveLength(0)
})

test('evaluate reports the nearest region with edge distance', () => {
  const tracker = new GeofenceTracker()
  const result = tracker.evaluate(outside, [region])
  expect(result.nearest?.region.id).toBe('test-cafe')
  expect(result.nearest?.edgeDistanceM).toBeCloseTo(400, 0)
})

test('buildNextRegionLabel formats inside, metres and kilometres', () => {
  expect(buildNextRegionLabel(null)).toBe('Next region: —')
  expect(buildNextRegionLabel({ region, edgeDistanceM: 0 })).toBe('Inside region · Test Café')
  expect(buildNextRegionLabel({ region, edgeDistanceM: 342 })).toBe(
    'Next region: Test Café · 340 m'
  )
  expect(buildNextRegionLabel({ region, edgeDistanceM: 1620 })).toBe(
    'Next region: Test Café · 1.6 km'
  )
})
