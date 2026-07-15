import type { ReactNode } from 'react'
import { createContext, useContext, useMemo, useState } from 'react'
import type { MapAdapter } from '../../services/map/MapAdapter'

interface MapContextValue {
  adapter: MapAdapter | null
  setAdapter: (adapter: MapAdapter | null) => void
}

const MapContext = createContext<MapContextValue | null>(null)

export function MapProvider({ children }: { children: ReactNode }) {
  const [adapter, setAdapter] = useState<MapAdapter | null>(null)
  const value = useMemo(() => ({ adapter, setAdapter }), [adapter])
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}

function useMapContext(): MapContextValue {
  const context = useContext(MapContext)
  if (!context) throw new Error('Map components must be rendered inside <MapProvider>')
  return context
}

/** The ready-to-use map adapter, or null while the map is still booting. */
export function useMapAdapter(): MapAdapter | null {
  return useMapContext().adapter
}

/** Registration setter used by the component that owns the map instance. */
export function useRegisterMapAdapter(): (adapter: MapAdapter | null) => void {
  return useMapContext().setAdapter
}
