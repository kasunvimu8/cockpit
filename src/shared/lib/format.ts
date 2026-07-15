/** Formats metres as '340 m' (rounded to 10 m steps) or '1.2 km'. */
export function formatDistanceM(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`
  return `${(meters / 1000).toFixed(1)} km`
}

/** Formats a route length in kilometres with one decimal, e.g. '4.2 km'. */
export function formatRouteLengthKm(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`
}

/** Formats a duration in minutes as '5 min', '1 hr 5 min' or '2 hr'. */
export function formatDurationMin(minutes: number): string {
  const whole = Math.max(1, Math.round(minutes))
  if (whole < 60) return `${whole} min`
  const hours = Math.floor(whole / 60)
  const rest = whole % 60
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`
}

/** Formats a Date as 24h 'HH:MM'. */
export function formatClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}
