import { useEffect, useState } from 'react'
import { formatClock } from '../../shared/lib/format'

/** Current wall-clock time as 'HH:MM', refreshed every second. */
export function useClock(): string {
  const [time, setTime] = useState(() => formatClock(new Date()))
  useEffect(() => {
    const id = window.setInterval(() => setTime(formatClock(new Date())), 1000)
    return () => window.clearInterval(id)
  }, [])
  return time
}
