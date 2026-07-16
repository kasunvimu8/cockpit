import type { OfferAdFormat } from '../../services/offers/offersClient'
import { useSettingsStore } from '../../store/settingsStore'
import { MultiSelectDropdown } from './MultiSelectDropdown'

const AD_FORMATS: { value: OfferAdFormat; label: string }[] = [
  { value: 'BRANDED_PIN', label: 'Branded Pin' },
  { value: 'RECOMMENDATION', label: 'Recommendation' },
  { value: 'SEARCH', label: 'Search' }
]

/** Multi-select dropdown for the offer ad formats shown in the head unit. */
export function AdFormatSelect() {
  const selected = useSettingsStore((state) => state.offersAdFormats)
  const toggleFormat = useSettingsStore((state) => state.toggleOffersAdFormat)

  return (
    <MultiSelectDropdown
      options={AD_FORMATS}
      selected={selected}
      onToggle={(value) => toggleFormat(value as OfferAdFormat)}
      ariaLabel="Ad formats"
    />
  )
}
