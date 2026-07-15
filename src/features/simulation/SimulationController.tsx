import { useEffect } from 'react'
import { DEFAULT_START } from '../../data/routes'
import { getCurrentPosition } from '../../services/location/currentPosition'
import { destinationPoint } from '../../shared/lib/geo'
import { RouteIndex } from '../../shared/lib/routeIndex'
import { useBootStore } from '../../store/bootStore'
import { useNavigationStore } from '../../store/navigationStore'
import { useSimulationStore } from '../../store/simulationStore'
import { useToastStore } from '../../store/toastStore'
import { useMapAdapter } from '../map/MapContext'
import { driveSimulator } from './DriveSimulator'

const MAX_FRAME_DT_S = 0.05

/**
 * Headless orchestrator: locates the vehicle, then advances it every frame,
 * driving the map adapter (marker + camera) and live guidance state.
 */
export function SimulationController() {
  const adapter = useMapAdapter()

  useEffect(() => {
    if (!adapter) return
    let disposed = false

    const bootPosition = async () => {
      const current = await getCurrentPosition()
      if (disposed) return
      if (!current) {
        useBootStore.getState().showNotice('Location unavailable — using the default position')
      }
      const start = current ?? DEFAULT_START
      // a minimal resting route parks the vehicle until a journey is started
      driveSimulator.setRoute(new RouteIndex([start, destinationPoint(start, 2, 0)]), {
        loop: false
      })
      useBootStore.getState().setRouteReady()
    }
    bootPosition()

    let last = performance.now()

    let frameId = requestAnimationFrame(function frame(now) {
      frameId = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 1000, MAX_FRAME_DT_S)
      last = now
      if (!driveSimulator.hasRoute) return

      const simulation = useSimulationStore.getState()
      const snapshot = simulation.playing
        ? driveSimulator.advance(simulation.speedKmh, dt)
        : driveSimulator.snapshot()
      if (!snapshot) return

      if (snapshot.arrived && simulation.playing) {
        simulation.setPlaying(false)
        useNavigationStore.getState().endNavigation()
        useToastStore.getState().show('You have arrived at your destination')
      }

      // the camera must not fight the journey overview (preview) or a user pan (free-look)
      const navigation = useNavigationStore.getState()
      adapter.updateFrame(
        snapshot,
        simulation.viewMode,
        simulation.zoomOffset,
        navigation.phase !== 'preview' && !simulation.freeLook
      )

      if (navigation.phase === 'navigating') {
        const traveledM = driveSimulator.distanceTraveledM
        const remainingM = Math.max(0, driveSimulator.routeLengthM - traveledM)
        const next = navigation.maneuvers.find((maneuver) => maneuver.atM > traveledM + 5) ?? null
        navigation.updateGuidance(
          Math.round(remainingM / 10) * 10,
          next
            ? {
                kind: next.kind,
                name: next.name,
                inM: Math.max(0, Math.round((next.atM - traveledM) / 10) * 10)
              }
            : null
        )
      }
    })

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
    }
  }, [adapter])

  return null
}
