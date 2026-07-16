import type { RecommendationTrigger } from '../../services/offers/offersClient'
import { useSettingsStore } from '../../store/settingsStore'
import { MultiSelectDropdown } from './MultiSelectDropdown'

/** Display labels for the vehicle triggers, in the service schema's order. */
export const RECOMMENDATION_TRIGGER_OPTIONS: { value: RecommendationTrigger; label: string }[] = [
  { value: 'TRIGGER_FUELLOW', label: 'Fuel low' },
  { value: 'TRIGGER_BATTERYLOW', label: 'Battery low' },
  { value: 'TRIGGER_OILLOW', label: 'Oil low' },
  { value: 'TRIGGER_SERVICEDUE', label: 'Service due' },
  { value: 'TRIGGER_BREAKNEEDED', label: 'Break needed' },
  { value: 'TRIGGER_LOWSPEED', label: 'Low speed' },
  { value: 'TRIGGER_JOURNEYEND', label: 'Journey end' },
  { value: 'TRIGGER_JOURNEYSTART', label: 'Journey start' }
]

/** Multi-select dropdown for the vehicle triggers the RECOMMENDATION format reacts to. */
export function RecommendationTriggerSelect() {
  const selected = useSettingsStore((state) => state.recommendationTriggers)
  const toggleTrigger = useSettingsStore((state) => state.toggleRecommendationTrigger)

  return (
    <MultiSelectDropdown
      options={RECOMMENDATION_TRIGGER_OPTIONS}
      selected={selected}
      onToggle={(value) => toggleTrigger(value as RecommendationTrigger)}
      ariaLabel="Recommendation triggers"
    />
  )
}
