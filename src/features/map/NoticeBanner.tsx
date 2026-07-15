import { useBootStore } from '../../store/bootStore'

/** Non-blocking, dismissible warning banner for degraded modes (no location, raster tiles…). */
export function NoticeBanner() {
  const notice = useBootStore((state) => state.notice)
  const dismissNotice = useBootStore((state) => state.dismissNotice)

  if (!notice) return null

  return (
    <div className="absolute bottom-[52px] left-1/2 z-6 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e8d49a] bg-[#fff8e6] py-1.5 pl-3 pr-1.5 text-[11px] text-[#8a6d1a]">
      <span>{notice}</span>
      <button
        type="button"
        className="flex h-5 w-5 flex-none cursor-pointer items-center justify-center rounded-md border-none bg-transparent text-[10px] text-[#8a6d1a] transition-colors hover:bg-[#00000014]"
        aria-label="Dismiss notice"
        onClick={dismissNotice}
      >
        ✕
      </button>
    </div>
  )
}
