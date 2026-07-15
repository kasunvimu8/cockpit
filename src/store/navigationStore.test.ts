import { expect, test } from 'vitest'
import { useNavigationStore } from './navigationStore'

test('navigation flow: preview, navigating, idle', () => {
  const store = useNavigationStore
  store.getState().previewRoute(
    { name: 'Your location', coord: [11.5, 48.1] },
    { name: 'Test', coord: [11.6, 48.2] },
    [
      [11.5, 48.1],
      [11.6, 48.2]
    ],
    1200,
    [{ atM: 600, kind: 'left', name: 'Teststraße' }]
  )
  expect(store.getState().phase).toBe('preview')
  expect(store.getState().origin?.name).toBe('Your location')
  expect(store.getState().routeCoordinates).toHaveLength(2)
  expect(store.getState().remainingM).toBe(1200)

  store.getState().startNavigation()
  expect(store.getState().phase).toBe('navigating')

  store.getState().updateGuidance(800, { kind: 'left', name: 'Teststraße', inM: 200 })
  expect(store.getState().remainingM).toBe(800)
  expect(store.getState().nextManeuver?.inM).toBe(200)

  store.getState().endNavigation()
  expect(store.getState().phase).toBe('idle')
  expect(store.getState().origin).toBeNull()
  expect(store.getState().destination).toBeNull()
  expect(store.getState().routeCoordinates).toBeNull()
  expect(store.getState().nextManeuver).toBeNull()
})
