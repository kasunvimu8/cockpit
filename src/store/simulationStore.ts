import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewMode = '2d' | '3d'

export const SPEED_MIN_KMH = 10
export const SPEED_MAX_KMH = 120
export const SPEED_STEP_KMH = 5
export const ZOOM_OFFSET_MIN = -8
export const ZOOM_OFFSET_MAX = 2.5
export const ZOOM_STEP = 0.5

interface SimulationState {
  playing: boolean
  speedKmh: number
  viewMode: ViewMode
  zoomOffset: number
  /** True after the user pans the map: the camera stops following until re-centred. */
  freeLook: boolean
  setPlaying: (playing: boolean) => void
  setSpeedKmh: (speedKmh: number) => void
  setViewMode: (viewMode: ViewMode) => void
  adjustZoom: (delta: number) => void
  setFreeLook: (freeLook: boolean) => void
}

/** Live simulation controls; the configured speed and view mode persist across sessions. */
export const useSimulationStore = create<SimulationState>()(
  persist(
    (set) => ({
      // the vehicle stays stopped on load until the driver presses Drive or Start
      playing: false,
      speedKmh: 40,
      viewMode: '2d',
      zoomOffset: 0,
      freeLook: false,
      setPlaying: (playing) => set({ playing }),
      setSpeedKmh: (speedKmh) => set({ speedKmh }),
      setViewMode: (viewMode) => set({ viewMode }),
      adjustZoom: (delta) =>
        set((state) => ({
          zoomOffset: Math.max(ZOOM_OFFSET_MIN, Math.min(ZOOM_OFFSET_MAX, state.zoomOffset + delta))
        })),
      setFreeLook: (freeLook) => set({ freeLook })
    }),
    {
      name: 'cockpit-simulation',
      version: 1,
      // one-time reset so sessions that persisted the old 3D default load in 2D
      migrate: (persisted) => ({ ...(persisted as SimulationState), viewMode: '2d' as ViewMode }),
      partialize: (state) => ({
        speedKmh: state.speedKmh,
        viewMode: state.viewMode
      })
    }
  )
)
