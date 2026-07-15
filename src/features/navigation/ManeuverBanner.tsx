import type { ManeuverKind } from '../../services/routing/maneuvers'
import { formatDistanceM } from '../../shared/lib/format'
import { useNavigationStore } from '../../store/navigationStore'

const ICONS: Record<ManeuverKind, string> = {
  straight: '↑',
  left: '↰',
  right: '↱',
  'slight-left': '↖',
  'slight-right': '↗',
  'sharp-left': '←',
  'sharp-right': '→',
  uturn: '↩',
  roundabout: '↻',
  arrive: '⚑'
}

/** Google-Maps-style next-turn banner shown top-left while navigating. */
export function ManeuverBanner() {
  const phase = useNavigationStore((state) => state.phase)
  const nextManeuver = useNavigationStore((state) => state.nextManeuver)

  if (phase !== 'navigating' || !nextManeuver) return null

  const label =
    nextManeuver.kind === 'arrive'
      ? nextManeuver.name || 'Destination'
      : nextManeuver.name || 'Continue'

  return (
    <div className="absolute left-3 top-3 z-5 flex min-w-[220px] items-center gap-3.5 rounded-[14px] bg-[#188038] px-4.5 py-3 text-white shadow-[0_10px_28px_#00000040]">
      <span className="text-[28px] font-bold leading-none">{ICONS[nextManeuver.kind]}</span>
      <span className="flex min-w-0 flex-col gap-px">
        <b className="text-[17px] font-extrabold">{formatDistanceM(nextManeuver.inM)}</b>
        <span className="max-w-60 overflow-hidden text-ellipsis whitespace-nowrap text-xs opacity-90">
          {label}
        </span>
      </span>
    </div>
  )
}
