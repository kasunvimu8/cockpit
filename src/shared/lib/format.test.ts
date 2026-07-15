import { expect, test } from 'vitest'
import { formatClock, formatDistanceM, formatDurationMin, formatRouteLengthKm } from './format'

test('formatDistanceM rounds metres to 10 m steps and switches to km', () => {
  expect(formatDistanceM(4)).toBe('0 m')
  expect(formatDistanceM(347)).toBe('350 m')
  expect(formatDistanceM(2540)).toBe('2.5 km')
})

test('formatRouteLengthKm renders one decimal', () => {
  expect(formatRouteLengthKm(4230)).toBe('4.2 km')
})

test('formatDurationMin renders minutes and hours readably', () => {
  expect(formatDurationMin(0.4)).toBe('1 min')
  expect(formatDurationMin(45)).toBe('45 min')
  expect(formatDurationMin(60)).toBe('1 hr')
  expect(formatDurationMin(877)).toBe('14 hr 37 min')
})

test('formatClock pads hours and minutes', () => {
  expect(formatClock(new Date(2026, 0, 5, 7, 3))).toBe('07:03')
})
