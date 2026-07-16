import { useEffect, useRef, useState } from 'react'

export interface MultiSelectOption {
  value: string
  label: string
}

interface Props {
  options: MultiSelectOption[]
  selected: string[]
  onToggle: (value: string) => void
  ariaLabel: string
  /** Trigger text when nothing is selected. */
  emptyLabel?: string
}

/**
 * Compact multi-select dropdown: a trigger button summarising the selection, opening a
 * checkbox list. Stays open while toggling; closes on outside tap.
 */
export function MultiSelectDropdown({
  options,
  selected,
  onToggle,
  ariaLabel,
  emptyLabel = 'None'
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const summary =
    selected.length === 0
      ? emptyLabel
      : selected.length === 1
        ? (options.find((option) => option.value === selected[0])?.label ?? '1 selected')
        : `${selected.length} selected`

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex w-40 cursor-pointer items-center justify-between gap-2 rounded-lg border border-line bg-chip px-2.5 py-[7px] font-sans text-xs text-text transition-colors hover:bg-hover"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{summary}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M2 3.5 5 6.5 8 3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1.5 w-44 rounded-xl border border-line bg-screen p-1 shadow-[0_12px_32px_#00000033]">
          {options.map((option) => {
            const active = selected.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none bg-transparent px-2.5 py-2 text-left font-sans text-xs text-text transition-colors hover:bg-hover"
                onClick={() => onToggle(option.value)}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border text-[9px] transition-colors ${active ? 'border-accent bg-accent text-white' : 'border-line bg-transparent text-transparent'}`}
                >
                  ✓
                </span>
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
