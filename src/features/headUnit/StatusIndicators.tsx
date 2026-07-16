import { BluetoothIcon, VolumeIcon } from '../../shared/components/icons'
import { useVehicleStore } from '../../store/vehicleStore'
import { useClock } from './useClock'

/** Floating status pill pinned to the top-right corner: connectivity, volume, temperature, clock. */
export function StatusIndicators() {
  const outsideTempC = useVehicleStore((state) => state.outsideTempC)
  const time = useClock()

  return (
    <div className="absolute right-[calc(var(--hu)*22px)] top-[calc(var(--hu)*22px)] z-8 flex items-center gap-[calc(var(--hu)*24px)] rounded-[calc(var(--hu)*10px)] bg-pill px-[calc(var(--hu)*19px)] py-[calc(var(--hu)*14px)] text-text backdrop-blur-sm">
      <VolumeIcon className="h-[calc(var(--hu)*18px)] w-auto text-text" />
      <BluetoothIcon className="h-[calc(var(--hu)*15px)] w-auto text-text" />
      <span className="whitespace-nowrap font-sans text-[calc(var(--hu)*20px)] font-semibold leading-none">
        {outsideTempC}°C
      </span>
      <span className="whitespace-nowrap font-sans text-[calc(var(--hu)*20px)] font-semibold leading-none tabular-nums">
        {time}
      </span>
    </div>
  )
}
