import { expect, test } from 'vitest'
import type { LngLat } from '../../shared/lib/geo'
import { withExactEndpoints } from './osrmClient'

const EXACT: LngLat = [11.5627623, 48.1747559]
const SNAPPED: LngLat = [11.562838, 48.174778]
const END: LngLat = [11.575, 48.14]

test('withExactEndpoints pins a snapped start back to the exact coordinate', () => {
  const route = withExactEndpoints([SNAPPED, END], EXACT, END)
  expect(route[0]).toEqual(EXACT)
  expect(route).toHaveLength(3)
})

test('withExactEndpoints leaves already-exact endpoints untouched', () => {
  const route = withExactEndpoints([EXACT, END], EXACT, END)
  expect(route).toHaveLength(2)
  expect(route[0]).toEqual(EXACT)
  expect(route[route.length - 1]).toEqual(END)
})

test('withExactEndpoints appends the exact destination when snapped away', () => {
  const snappedEnd: LngLat = [11.5752, 48.1402]
  const route = withExactEndpoints([EXACT, snappedEnd], EXACT, END)
  expect(route[route.length - 1]).toEqual(END)
})
