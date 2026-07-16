import { LogoMark } from '../../shared/components/icons'

/** Floating wordmark pinned to the top-left corner of the screen. */
export function Logo() {
  return (
    <div className="absolute left-[calc(var(--hu)*26px)] top-[calc(var(--hu)*22px)] z-8 text-text">
      <LogoMark className="h-[calc(var(--hu)*22.568px)] w-auto" />
    </div>
  )
}
