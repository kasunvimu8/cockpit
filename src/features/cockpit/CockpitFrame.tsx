import type { ReactNode } from 'react'
import backdropUrl from '../../assets/cockpitBackground.png'
import { useViewportSize } from '../../shared/hooks/useViewportSize'
import { computeBackdropLayout } from './backdropTransform'

/**
 * Photographic cockpit backdrop. The photo is scaled and offset so its in-dash display
 * sits exactly behind the head unit, which is centred in the viewport.
 */
export function CockpitFrame({ children }: { children: ReactNode }) {
  const { width, height } = useViewportSize()
  const layout = computeBackdropLayout(width, height)

  return (
    <div className="relative h-full overflow-hidden bg-[#0b0e13]">
      <img
        className="pointer-events-none absolute select-none"
        src={backdropUrl}
        alt=""
        draggable={false}
        style={{
          width: layout.width,
          height: layout.height,
          left: layout.left,
          top: layout.top
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_35%,#00000055_80%,#00000099_100%)]" />
      {children}
    </div>
  )
}
