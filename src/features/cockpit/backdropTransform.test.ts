import { expect, test } from 'vitest'
import {
  COCKPIT_BACKDROP,
  computeBackdropLayout,
  computeHeadUnitWidth,
  HEAD_UNIT_ASPECT
} from './backdropTransform'

const LANDSCAPE_VIEWPORTS: [number, number][] = [
  [1000, 650],
  [1412, 850],
  [1512, 950],
  [1680, 1050],
  [1920, 1080]
]

const ALL_VIEWPORTS: [number, number][] = [...LANDSCAPE_VIEWPORTS, [800, 1200]]

test('the display-slab centre always lands on the viewport centre', () => {
  for (const [width, height] of ALL_VIEWPORTS) {
    const layout = computeBackdropLayout(width, height)
    const scale = layout.width / COCKPIT_BACKDROP.width
    expect(layout.left + COCKPIT_BACKDROP.displayCenterX * scale).toBeCloseTo(width / 2, 6)
    expect(layout.top + COCKPIT_BACKDROP.displayCenterY * scale).toBeCloseTo(height / 2, 6)
  }
})

test('the head unit fully covers the display slab on landscape viewports', () => {
  for (const [width, height] of LANDSCAPE_VIEWPORTS) {
    const layout = computeBackdropLayout(width, height)
    const scale = layout.width / COCKPIT_BACKDROP.width
    const unitWidth = computeHeadUnitWidth(width, height)
    const unitHeight = unitWidth / HEAD_UNIT_ASPECT
    expect(unitWidth + 0.001).toBeGreaterThanOrEqual(COCKPIT_BACKDROP.displayWidth * scale)
    expect(unitHeight + 0.001).toBeGreaterThanOrEqual(COCKPIT_BACKDROP.displayHeight * scale)
  }
})

test('the head unit always fits inside the viewport', () => {
  for (const [width, height] of ALL_VIEWPORTS) {
    const unitWidth = computeHeadUnitWidth(width, height)
    expect(unitWidth).toBeLessThanOrEqual(width)
    expect(unitWidth / HEAD_UNIT_ASPECT).toBeLessThanOrEqual(height)
  }
})

test('the image always covers the whole viewport', () => {
  for (const [width, height] of ALL_VIEWPORTS) {
    const layout = computeBackdropLayout(width, height)
    expect(layout.left).toBeLessThanOrEqual(0)
    expect(layout.top).toBeLessThanOrEqual(0)
    expect(layout.left + layout.width).toBeGreaterThanOrEqual(width)
    expect(layout.top + layout.height).toBeGreaterThanOrEqual(height)
  }
})
