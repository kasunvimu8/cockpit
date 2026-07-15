import { create } from 'zustand'
import type { CampaignRegion } from '../data/campaigns'

interface CampaignState {
  regions: CampaignRegion[]
  activeOffer: CampaignRegion | null
  nextRegionLabel: string
  initRegions: (regions: CampaignRegion[]) => void
  presentOffer: (region: CampaignRegion) => void
  clearOffer: () => void
  setNextRegionLabel: (label: string) => void
}

export const useCampaignStore = create<CampaignState>()((set, get) => ({
  regions: [],
  activeOffer: null,
  nextRegionLabel: 'Next region: —',
  initRegions: (regions) => set({ regions }),
  presentOffer: (region) => set({ activeOffer: region }),
  clearOffer: () => set({ activeOffer: null }),
  setNextRegionLabel: (label) => {
    if (get().nextRegionLabel !== label) set({ nextRegionLabel: label })
  }
}))
