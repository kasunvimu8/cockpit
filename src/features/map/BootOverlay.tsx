import { useBootStore } from '../../store/bootStore'

/** Full-screen loading state shown until both the map style and the route are ready. */
export function BootOverlay() {
  const mapReady = useBootStore((state) => state.mapReady)
  const routeReady = useBootStore((state) => state.routeReady)
  const fatalError = useBootStore((state) => state.fatalError)

  if (mapReady && routeReady && !fatalError) return null

  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-2.5 bg-screen px-10 text-center text-[13px] ${fatalError ? 'font-semibold text-[#a33]' : 'text-muted'}`}
    >
      {!fatalError && (
        <div className="h-[26px] w-[26px] animate-spin rounded-full border-[3px] border-line border-t-accent" />
      )}
      <span>{fatalError ?? 'Loading map & locating vehicle…'}</span>
    </div>
  )
}
