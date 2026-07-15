import { useToastStore } from '../../store/toastStore'

/** Transient status pill at the top of the screen; driven by the toast store. */
export function Toast() {
  const message = useToastStore((state) => state.message)
  const visible = useToastStore((state) => state.visible)

  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-3 z-7 whitespace-nowrap rounded-full border border-line bg-surface px-4 py-[7px] text-[11.5px] font-semibold text-teal shadow-[0_4px_16px_#00000014] transition-all duration-[400ms] ${visible ? '-translate-x-1/2 translate-y-0 opacity-100' : '-translate-x-1/2 -translate-y-2.5 opacity-0'}`}
    >
      {message}
    </div>
  )
}
