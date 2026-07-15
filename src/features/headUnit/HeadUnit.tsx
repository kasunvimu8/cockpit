import type { ReactNode } from 'react'
import { useViewportSize } from '../../shared/hooks/useViewportSize'
import { computeHeadUnitWidth } from '../cockpit/backdropTransform'

/**
 * The physical head unit: dark bezel framing the infotainment screen. Sized so it always
 * covers the display slab in the backdrop photo behind it.
 */
export function HeadUnit({ children }: { children: ReactNode }) {
  const { width, height } = useViewportSize()
  return (
    <div
      className="absolute left-1/2 top-1/2 z-[3] aspect-[16/9.4] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-[#0c0d0f] p-3.5 shadow-[0_40px_90px_#000000d0,inset_0_1px_0_#ffffff14,0_0_0_1px_#00000080]"
      style={{ width: computeHeadUnitWidth(width, height) }}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[10px] bg-screen">
        {children}
      </div>
    </div>
  )
}
