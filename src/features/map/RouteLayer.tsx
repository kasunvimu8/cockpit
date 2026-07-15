import { useEffect } from 'react'
import { useNavigationStore } from '../../store/navigationStore'
import { useMapAdapter } from './MapContext'

/** Draws the guidance polyline and frames the journey overview while previewing. */
export function RouteLayer() {
  const adapter = useMapAdapter()
  const phase = useNavigationStore((state) => state.phase)
  const coordinates = useNavigationStore((state) => state.routeCoordinates)

  useEffect(() => {
    if (!adapter) return
    adapter.setRoutePath(coordinates)
    return () => adapter.setRoutePath(null)
  }, [adapter, coordinates])

  useEffect(() => {
    if (!adapter || phase !== 'preview' || !coordinates) return
    adapter.frameRouteOverview(coordinates)
  }, [adapter, phase, coordinates])

  return null
}
