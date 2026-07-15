import type { LngLat } from '../shared/lib/geo'

/** Static campaign configuration: where a region sits along the demo route and what it offers. */
export interface CampaignDefinition {
  id: string
  /** Fraction (0–1) along the demo loop where the region is anchored. */
  routeFraction: number
  radiusM: number
  name: string
  tag: string
  icon: string
  offerTitle: string
  offerDescription: string
  color: string
}

/** A campaign definition resolved to a fixed geographic position. */
export interface CampaignRegion extends CampaignDefinition {
  center: LngLat
}

export const CAMPAIGN_DEFINITIONS: CampaignDefinition[] = [
  {
    id: 'kaffeehaus-nord',
    routeFraction: 0.25,
    radiusM: 120,
    name: 'Kaffeehaus Nord',
    tag: 'Food & drink',
    icon: '☕',
    offerTitle: '−20% on fresh coffee',
    offerDescription: 'Kaffeehaus Nord · 200 m ahead on the right',
    color: '#0ea5a0'
  },
  {
    id: 'ionity-hub',
    routeFraction: 0.65,
    radiusM: 140,
    name: 'IONITY Hub',
    tag: 'EV charging',
    icon: '⚡',
    offerTitle: 'Charge for 0.39 €/kWh',
    offerDescription: 'IONITY Hub · reserved slot until 18:30',
    color: '#d97706'
  }
]
