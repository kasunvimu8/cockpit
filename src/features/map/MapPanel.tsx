import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { useNavigationStore } from '../../store/navigationStore'
import { useSimulationStore } from '../../store/simulationStore'
import { useMapAdapter } from './MapContext'

const WHEEL_ZOOM_FACTOR = 0.0018

/** Map viewport wrapper hosting overlay UI; converts scroll gestures into camera zoom. */
export function MapPanel({ children }: { children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const adapter = useMapAdapter()

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = -event.deltaY * WHEEL_ZOOM_FACTOR
      // when the follow camera is suspended (overview or user pan), zoom the map directly
      const suspended =
        useNavigationStore.getState().phase === 'preview' || useSimulationStore.getState().freeLook
      if (suspended) adapter?.nudgeZoom(delta)
      else useSimulationStore.getState().adjustZoom(delta)
    }
    panel.addEventListener('wheel', onWheel, { passive: false })
    return () => panel.removeEventListener('wheel', onWheel)
  }, [adapter])

  return (
    <div ref={panelRef} className="relative min-h-0 min-w-0 flex-1">
      {children}
    </div>
  )
}
