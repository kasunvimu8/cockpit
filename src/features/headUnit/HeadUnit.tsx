import type { CSSProperties, ReactNode } from 'react'
import { useViewportSize } from '../../shared/hooks/useViewportSize'
import { computeHeadUnitWidth } from '../cockpit/backdropTransform'

/**
 * The physical head unit: dark bezel framing the infotainment screen. Sized so it always
 * covers the display slab in the backdrop photo behind it.
 */
/** Reference width (px) of the Figma screen the floating UI was designed at; see --hu below. */
const DESIGN_WIDTH_PX = 1012

export function HeadUnit({ children }: { children: ReactNode }) {
  const { width, height } = useViewportSize()
  const headUnitWidth = computeHeadUnitWidth(width, height)
  return (
    <div
      className="absolute left-1/2 top-1/2 z-[3] aspect-[16/9.4] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-[#0c0d0f] p-3.5 shadow-[0_40px_90px_#000000d0,inset_0_1px_0_#ffffff14,0_0_0_1px_#00000080]"
      style={{ width: headUnitWidth }}
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[10px] bg-screen"
        style={{ '--hu': headUnitWidth / DESIGN_WIDTH_PX } as CSSProperties}
      >
        {children}
      </div>
    </div>
  )
}
