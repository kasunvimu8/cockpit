import { create } from 'zustand'

export type Gear = 'P' | 'R' | 'N' | 'D'
export type CabinSide = 'left' | 'right'

const CABIN_TEMP_MIN_C = 16
const CABIN_TEMP_MAX_C = 28

interface VehicleState {
  gear: Gear
  batteryPercent: number
  outsideTempC: number
  cabinTempC: Record<CabinSide, number>
  adjustCabinTemp: (side: CabinSide, delta: number) => void
}

/** Mocked vehicle signals — replace the initial values with a real vehicle data feed. */
export const useVehicleStore = create<VehicleState>()((set) => ({
  gear: 'D',
  batteryPercent: 45,
  outsideTempC: 21,
  cabinTempC: { left: 21, right: 21 },
  adjustCabinTemp: (side, delta) =>
    set((state) => ({
      cabinTempC: {
        ...state.cabinTempC,
        [side]: Math.max(
          CABIN_TEMP_MIN_C,
          Math.min(CABIN_TEMP_MAX_C, state.cabinTempC[side] + delta)
        )
      }
    }))
}))
