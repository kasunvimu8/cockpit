import { useVehicleStore } from '../../store/vehicleStore'
import { useClock } from './useClock'

/** Status strip: brand, battery, clock, outside temperature and connectivity. */
export function TopBar() {
  const batteryPercent = useVehicleStore((state) => state.batteryPercent)
  const outsideTempC = useVehicleStore((state) => state.outsideTempC)
  const time = useClock()

  return (
    <div className="z-8 grid h-8.5 flex-none grid-cols-[1fr_auto_1fr] items-center border-b border-line bg-screen px-4 text-[11.5px] text-muted">
      <div className="flex items-center gap-4">
        <span className="whitespace-nowrap text-xs font-bold tracking-[0.16em] text-text">
          4SCREEN
        </span>
        <span className="flex items-center gap-1.5">
          <span className="relative inline-block h-2.5 w-5.5 rounded-[3px] border-[1.5px] border-[#9aa0a8] after:absolute after:-right-1 after:top-0.5 after:h-1 after:w-[2.5px] after:rounded-[1px] after:bg-[#9aa0a8] after:content-['']">
            <span
              className="absolute bottom-[1.5px] left-[1.5px] top-[1.5px] rounded-[1px] bg-[#3fb75e]"
              style={{ width: `${batteryPercent}%` }}
            />
          </span>
          {batteryPercent} %
        </span>
      </div>
      <div className="flex items-center justify-center gap-4">
        <span className="font-mono text-text">{time}</span>
        <span>{outsideTempC} °C</span>
      </div>
      <div className="flex items-center justify-end gap-4">
        <span>📶</span>
      </div>
    </div>
  )
}
