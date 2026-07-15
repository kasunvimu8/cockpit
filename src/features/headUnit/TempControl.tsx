import type { CabinSide } from '../../store/vehicleStore'
import { useVehicleStore } from '../../store/vehicleStore'

const CHEVRON_CLASSES =
  'cursor-pointer border-none bg-transparent p-0 font-mono text-[11px] text-launcher-muted'

/** Cabin temperature stepper for one side of the car. */
export function TempControl({ side }: { side: CabinSide }) {
  const temperature = useVehicleStore((state) => state.cabinTempC[side])
  const adjustCabinTemp = useVehicleStore((state) => state.adjustCabinTemp)

  return (
    <div className="flex items-center gap-2 font-mono text-sm text-launcher-text">
      <button
        type="button"
        className={CHEVRON_CLASSES}
        aria-label={`Decrease ${side} temperature`}
        onClick={() => adjustCabinTemp(side, -1)}
      >
        ‹
      </button>
      {temperature}
      <button
        type="button"
        className={CHEVRON_CLASSES}
        aria-label={`Increase ${side} temperature`}
        onClick={() => adjustCabinTemp(side, 1)}
      >
        ›
      </button>
    </div>
  )
}
