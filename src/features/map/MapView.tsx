import { useEffect, useRef } from 'react'
import { DEFAULT_START } from '../../data/routes'
import { GoogleMapsAdapter } from '../../services/map/googleMapsAdapter'
import type { MapAdapter, MapAdapterHandlers } from '../../services/map/MapAdapter'
import { MaplibreMapAdapter } from '../../services/map/maplibreMapAdapter'
import { MAP_PROVIDER } from '../../services/map/mapProvider'
import { useBootStore } from '../../store/bootStore'
import { useNavigationStore } from '../../store/navigationStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useSimulationStore } from '../../store/simulationStore'
import { BootOverlay } from './BootOverlay'
import { useRegisterMapAdapter } from './MapContext'
import { NoticeBanner } from './NoticeBanner'

/** Owns the map adapter lifecycle and renders the boot overlay on top of the map. */
export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const adapterRef = useRef<MapAdapter | null>(null)
  const registerAdapter = useRegisterMapAdapter()
  const theme = useSettingsStore((state) => state.theme)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let disposed = false
    let activeProvider = MAP_PROVIDER
    const { setMapReady, setFatalError, showNotice } = useBootStore.getState()

    const handlers: MapAdapterHandlers = {
      onReady: () => {
        if (disposed) return
        registerAdapter(adapterRef.current)
        setMapReady()
      },
      onNotice: showNotice,
      onUserPan: () => useSimulationStore.getState().setFreeLook(true),
      // a map recreation (theme change) must restore the framed journey, not reset the view
      onViewReset: () => {
        requestAnimationFrame(() => {
          const navigation = useNavigationStore.getState()
          if (navigation.phase === 'preview' && navigation.routeCoordinates) {
            adapterRef.current?.frameRouteOverview(navigation.routeCoordinates)
          }
        })
      },
      onFatal: (message) => {
        if (disposed) return
        // Google failures (bad key, referrer restriction) degrade to the MapLibre provider
        if (activeProvider === 'google') {
          activeProvider = 'maplibre'
          showNotice(`${message} Using the OpenFreeMap fallback.`)
          registerAdapter(null)
          adapterRef.current?.dispose()
          adapterRef.current = new MaplibreMapAdapter(
            container,
            DEFAULT_START,
            useSettingsStore.getState().theme,
            handlers
          )
          return
        }
        setFatalError(message)
      }
    }

    const initialTheme = useSettingsStore.getState().theme
    adapterRef.current =
      activeProvider === 'google'
        ? new GoogleMapsAdapter(container, DEFAULT_START, initialTheme, handlers)
        : new MaplibreMapAdapter(container, DEFAULT_START, initialTheme, handlers)

    return () => {
      disposed = true
      adapterRef.current?.dispose()
      adapterRef.current = null
      registerAdapter(null)
    }
  }, [registerAdapter])

  useEffect(() => {
    adapterRef.current?.setTheme(theme)
  }, [theme])

  return (
    <>
      {/* h-full/w-full needed alongside inset-0: MapLibre's own .maplibregl-map CSS
          sets position: relative on the container, which disables inset sizing */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      <BootOverlay />
      <NoticeBanner />
    </>
  )
}
