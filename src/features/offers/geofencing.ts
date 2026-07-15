import type { CampaignRegion } from '../../data/campaigns'
import { formatDistanceM } from '../../shared/lib/format'
import type { LngLat } from '../../shared/lib/geo'
import { haversineDistance } from '../../shared/lib/geo'

export interface NearestRegion {
  region: CampaignRegion
  /** Metres from the vehicle to the region edge; 0 when inside. */
  edgeDistanceM: number
}

export interface GeofenceEvaluation {
  entered: CampaignRegion[]
  exited: CampaignRegion[]
  nearest: NearestRegion | null
}

/** Tracks which regions the vehicle is inside and emits enter/exit transitions. */
export class GeofenceTracker {
  private readonly inside = new Set<string>()

  evaluate(position: LngLat, regions: CampaignRegion[]): GeofenceEvaluation {
    const entered: CampaignRegion[] = []
    const exited: CampaignRegion[] = []
    let nearest: NearestRegion | null = null

    for (const region of regions) {
      const distance = haversineDistance(position, region.center)
      const edgeDistanceM = Math.max(0, distance - region.radiusM)
      if (!nearest || edgeDistanceM < nearest.edgeDistanceM) nearest = { region, edgeDistanceM }

      const isInside = distance < region.radiusM
      const wasInside = this.inside.has(region.id)
      if (isInside && !wasInside) {
        this.inside.add(region.id)
        entered.push(region)
      } else if (!isInside && wasInside) {
        this.inside.delete(region.id)
        exited.push(region)
      }
    }

    return { entered, exited, nearest }
  }
}

/** Human-readable label for the next-region proximity chip. */
export function buildNextRegionLabel(nearest: NearestRegion | null): string {
  if (!nearest) return 'Next region: —'
  if (nearest.edgeDistanceM < 1) return `Inside region · ${nearest.region.name}`
  return `Next region: ${nearest.region.name} · ${formatDistanceM(nearest.edgeDistanceM)}`
}
