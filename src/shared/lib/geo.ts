import type { Feature, Polygon } from 'geojson'

/** [longitude, latitude] pair, WGS84. */
export type LngLat = [number, number]

const EARTH_RADIUS_M = 6371000

const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const toDegrees = (radians: number) => (radians * 180) / Math.PI

/** Great-circle distance between two coordinates in metres. */
export function haversineDistance(a: LngLat, b: LngLat): number {
  const dLat = toRadians(b[1] - a[1])
  const dLng = toRadians(b[0] - a[0])
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a[1])) * Math.cos(toRadians(b[1])) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(s))
}

/** Initial bearing from `a` to `b` in degrees, normalised to [0, 360). */
export function bearingBetween(a: LngLat, b: LngLat): number {
  const y = Math.sin(toRadians(b[0] - a[0])) * Math.cos(toRadians(b[1]))
  const x =
    Math.cos(toRadians(a[1])) * Math.sin(toRadians(b[1])) -
    Math.sin(toRadians(a[1])) * Math.cos(toRadians(b[1])) * Math.cos(toRadians(b[0] - a[0]))
  return (toDegrees(Math.atan2(y, x)) + 360) % 360
}

/** Coordinate reached by travelling `distanceM` metres from `origin` on bearing `bearingDeg`. */
export function destinationPoint(origin: LngLat, distanceM: number, bearingDeg: number): LngLat {
  const angular = distanceM / EARTH_RADIUS_M
  const heading = toRadians(bearingDeg)
  const lat1 = toRadians(origin[1])
  const lng1 = toRadians(origin[0])
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(heading)
  )
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(heading) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2)
    )
  return [toDegrees(lng2), toDegrees(lat2)]
}

/** GeoJSON polygon approximating a circle around `center`. */
export function circlePolygon(center: LngLat, radiusM: number, steps = 64): Feature<Polygon> {
  const ring: LngLat[] = []
  for (let i = 0; i <= steps; i++) ring.push(destinationPoint(center, radiusM, (i * 360) / steps))
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }
}

/** Interpolates between two angles along the shortest arc. */
export function lerpAngle(from: number, to: number, factor: number): number {
  const delta = ((to - from + 540) % 360) - 180
  return (from + delta * factor + 360) % 360
}
