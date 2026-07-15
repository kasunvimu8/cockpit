import type { LngLat } from '../../shared/lib/geo'
import type { RouteIndex } from '../../shared/lib/routeIndex'

/** Distance before the route end at which the vehicle is considered arrived. */
export const ARRIVAL_BUFFER_M = 3

export interface DriveSnapshot {
  position: LngLat
  bearing: number
  arrived: boolean
}

export interface RouteOptions {
  loop: boolean
}

/** Advances a virtual vehicle along a route based on elapsed time and target speed. */
export class DriveSimulator {
  private route: RouteIndex | null = null
  private distanceM = 0
  private loop = true

  get hasRoute(): boolean {
    return this.route !== null
  }

  get routeLengthM(): number {
    return this.route?.totalLengthM ?? 0
  }

  get distanceTraveledM(): number {
    return this.distanceM
  }

  get position(): LngLat | null {
    return this.snapshot()?.position ?? null
  }

  setRoute(route: RouteIndex, options: RouteOptions): void {
    this.route = route
    this.loop = options.loop
    this.distanceM = 0
  }

  advance(speedKmh: number, dtSeconds: number): DriveSnapshot | null {
    if (!this.route) return null
    this.distanceM += (speedKmh / 3.6) * dtSeconds
    let arrived = false
    if (this.loop) {
      this.distanceM = this.distanceM % this.route.totalLengthM
    } else if (this.distanceM >= this.route.totalLengthM - ARRIVAL_BUFFER_M) {
      this.distanceM = this.route.totalLengthM - ARRIVAL_BUFFER_M
      arrived = true
    }
    return this.buildSnapshot(this.route, arrived)
  }

  snapshot(): DriveSnapshot | null {
    if (!this.route) return null
    return this.buildSnapshot(this.route, false)
  }

  private buildSnapshot(route: RouteIndex, arrived: boolean): DriveSnapshot {
    const point = route.pointAt(this.distanceM)
    return { position: point.position, bearing: point.bearing, arrived }
  }
}

/** App-wide simulator instance shared by the simulation loop and navigation. */
export const driveSimulator = new DriveSimulator()
