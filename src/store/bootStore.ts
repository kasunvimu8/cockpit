import { create } from 'zustand'

interface BootState {
  mapReady: boolean
  routeReady: boolean
  fatalError: string | null
  notice: string | null
  setMapReady: () => void
  setRouteReady: () => void
  setFatalError: (message: string) => void
  showNotice: (message: string) => void
  dismissNotice: () => void
}

/** Startup progress of the head unit: map style, route snapping and degradation notices. */
export const useBootStore = create<BootState>()((set) => ({
  mapReady: false,
  routeReady: false,
  fatalError: null,
  notice: null,
  setMapReady: () => set({ mapReady: true }),
  setRouteReady: () => set({ routeReady: true }),
  setFatalError: (message) => set({ fatalError: message }),
  showNotice: (message) => set({ notice: message }),
  dismissNotice: () => set({ notice: null })
}))
