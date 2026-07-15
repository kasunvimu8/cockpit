import { expect, test } from 'vitest'
import { CAMPAIGN_DEFINITIONS } from '../../data/campaigns'
import { haversineDistance } from '../../shared/lib/geo'
import { RouteIndex } from '../../shared/lib/routeIndex'
import { buildCampaignRegions } from './campaignRegions'

test('buildCampaignRegions anchors every definition 60 m beside the route', () => {
  const route = new RouteIndex([
    [11.57, 48.13],
    [11.57, 48.14],
    [11.58, 48.14]
  ])
  const regions = buildCampaignRegions(route)
  expect(regions).toHaveLength(CAMPAIGN_DEFINITIONS.length)
  for (const region of regions) {
    const anchor = route.pointAt(region.routeFraction * route.totalLengthM)
    expect(haversineDistance(anchor.position, region.center)).toBeCloseTo(60, 0)
  }
})
