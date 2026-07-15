import type { LngLat } from './geo'
import { bearingBetween, haversineDistance } from './geo'

export interface RoutePoint {
  position: LngLat
  bearing: number
}

/** Immutable polyline indexed by cumulative distance for fast position lookups. */
export class RouteIndex {
  readonly coordinates: LngLat[]
  readonly totalLengthM: number
  private readonly cumulativeM: number[]

  constructor(coordinates: LngLat[]) {
    if (coordinates.length < 2) throw new Error('A route needs at least two coordinates')
    this.coordinates = coordinates
    this.cumulativeM = [0]
    for (let i = 1; i < coordinates.length; i++) {
      this.cumulativeM.push(
        this.cumulativeM[i - 1] + haversineDistance(coordinates[i - 1], coordinates[i])
      )
    }
    this.totalLengthM = this.cumulativeM[this.cumulativeM.length - 1]
  }

  /** Cumulative distance from the start to the coordinate at `index`. */
  distanceAt(index: number): number {
    return this.cumulativeM[Math.max(0, Math.min(index, this.cumulativeM.length - 1))]
  }

  /** Position and travel bearing at `distanceM` along the route, clamped to its bounds. */
  pointAt(distanceM: number): RoutePoint {
    const clamped = Math.max(0, Math.min(distanceM, this.totalLengthM - 0.01))
    let lo = 0
    let hi = this.cumulativeM.length - 1
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1
      if (this.cumulativeM[mid] <= clamped) lo = mid
      else hi = mid
    }
    const segmentM = this.cumulativeM[hi] - this.cumulativeM[lo] || 1
    const f = (clamped - this.cumulativeM[lo]) / segmentM
    const a = this.coordinates[lo]
    const b = this.coordinates[hi]
    return {
      position: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f],
      bearing: bearingBetween(a, b)
    }
  }
}
