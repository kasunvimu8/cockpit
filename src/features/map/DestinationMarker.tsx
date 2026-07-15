import { useEffect } from 'react'
import { useNavigationStore } from '../../store/navigationStore'
import { useMapAdapter } from './MapContext'

/** Keeps the map adapter's destination flag in sync with the active navigation target. */
export function DestinationMarker() {
  const adapter = useMapAdapter()
  const destination = useNavigationStore((state) => state.destination)

  useEffect(() => {
    if (!adapter) return
    adapter.setDestination(destination?.coord ?? null)
    return () => adapter.setDestination(null)
  }, [adapter, destination])

  return null
}
