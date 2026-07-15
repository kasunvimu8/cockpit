import type { CampaignDefinition, CampaignRegion } from '../../data/campaigns'
import { CAMPAIGN_DEFINITIONS } from '../../data/campaigns'
import { destinationPoint } from '../../shared/lib/geo'
import type { RouteIndex } from '../../shared/lib/routeIndex'

/** How far beside the route a campaign region is anchored. */
const LATERAL_OFFSET_M = 60

/** Anchors campaign definitions to fixed geographic positions just off the given route. */
export function buildCampaignRegions(
  route: RouteIndex,
  definitions: CampaignDefinition[] = CAMPAIGN_DEFINITIONS
): CampaignRegion[] {
  return definitions.map((definition) => {
    const anchor = route.pointAt(definition.routeFraction * route.totalLengthM)
    return {
      ...definition,
      center: destinationPoint(anchor.position, LATERAL_OFFSET_M, (anchor.bearing + 90) % 360)
    }
  })
}
