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
    <div className="absolute left-[calc(var(--hu)*82px)] top-[calc(var(--hu)*72px)] z-8 flex min-w-[220px] items-center gap-3.5 rounded-[14px] border border-btn-border bg-surface px-4.5 py-3 text-text shadow-[0_10px_28px_#00000026] backdrop-blur-sm">
      <span className="text-[28px] font-bold leading-none text-nav-green">
        {ICONS[nextManeuver.kind]}
      </span>
      <span className="flex min-w-0 flex-col gap-px">
        <b className="text-[17px] font-extrabold text-nav-green">
          {formatDistanceM(nextManeuver.inM)}
        </b>
        <span className="max-w-60 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted">
          {label}
        </span>
      </span>
    </div>
  )
}
