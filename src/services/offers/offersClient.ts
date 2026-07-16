import type { LngLat } from '../../shared/lib/geo'

/**
 * Client for the supply-provisioning-service internal offers endpoint
 * (POST /api/supply/v1/internal/offers, proxied by Vite to avoid CORS — no auth needed).
 * Fetches BRANDED_PIN and DETAILS_SCREEN offers around a position and maps them into
 * per-POI domain objects for the head unit.
 */

const OFFERS_ENDPOINT = '/api/supply/v1/internal/offers'
const OFFER_ASSETS_ENDPOINT = '/api/supply/v1/offers/assets'
const DEVICE_ID = 'HACKATHON_DEMO_DEVICE'
/** The service rejects radii above 30 km. */
export const OFFERS_MAX_RADIUS_M = 30000
export const OFFERS_MIN_RADIUS_M = 500

/** Ad formats the driver can enable in the settings panel. */
export type OfferAdFormat = 'BRANDED_PIN' | 'RECOMMENDATION' | 'SEARCH'

/**
 * Vehicle triggers accepted for the RECOMMENDATION ad format, in the order listed by the
 * service's OpenAPI schema. Requests take at most ONE trigger per ad-format entry:
 * `{ "adFormatType": "RECOMMENDATION", "triggers": ["TRIGGER_FUELLOW"] }`.
 */
export const RECOMMENDATION_TRIGGERS = [
  'TRIGGER_FUELLOW',
  'TRIGGER_BATTERYLOW',
  'TRIGGER_OILLOW',
  'TRIGGER_SERVICEDUE',
  'TRIGGER_BREAKNEEDED',
  'TRIGGER_LOWSPEED',
  'TRIGGER_JOURNEYEND',
  'TRIGGER_JOURNEYSTART'
] as const

export type RecommendationTrigger = (typeof RECOMMENDATION_TRIGGERS)[number]

const BRAND = (import.meta.env.VITE_OFFERS_BRAND ?? '').trim() || 'BRAND_TOYOTA'
const ASSET_CONSUMER_ID =
  (import.meta.env.VITE_OFFERS_ASSET_CONSUMER_ID ?? '').trim() ||
  `${BRAND}_fd17eccf-1b18-4c4b-8f4e-8991f9d80bbc`

/* --- transfer objects (subset of OfferResponseTO from the service's OpenAPI spec) --- */

interface OfferAssetTO {
  adFormatType: string
  assetType: string
  language: string
  content?: Record<string, unknown>
}

interface OfferPoiTO {
  poiId: string
  name: string
  location: { latitude: number; longitude: number }
  street?: string
  streetNumber?: string | null
  postalCode?: string
  city?: string
  categories?: string[]
  isCurrentlyOpen?: boolean
  /** GraphQL variant of isCurrentlyOpen (portal/BFF responses), null when unknown. */
  currentlyOpen?: boolean | null
}

interface OfferTO {
  adFormat: string
  offerId: string
  campaignId?: string
  /** All formats this offer carries assets for (a BP offer can bundle its DS assets). */
  adFormatsWithAssets?: string[]
  additionalAdFormats?: string[]
  poi?: OfferPoiTO
  organizationName?: string
  organization?: { organizationName?: string }
  assets?: OfferAssetTO[]
}

export interface OffersResponseTO {
  offers?: OfferTO[]
}

/* --- domain objects --- */

export interface DetailsScreenContent {
  headline?: string
  description?: string
  brandLogoUrl?: string
  productImageUrl1?: string
  productImageUrl2?: string
  /** CTA action types, e.g. START_NAVIGATION. */
  callToActions: string[]
}

/** RECOMMENDATION_BASIC asset content shown in the in-drive recommendation card. */
export interface RecommendationContent {
  headline?: string
  description?: string
  brandLogoImageUrl?: string
}

/** All offer content for one POI: pin visual (BRANDED_PIN) + details screen assets. */
export interface PoiOffer {
  id: string
  name: string
  coord: LngLat
  /** Ad formats delivered for this POI (BRANDED_PIN, DETAILS_SCREEN, …). */
  formats: string[]
  address?: string
  isOpen?: boolean
  category?: string
  campaignId?: string
  organizationName?: string
  /** BRANDED_PIN_BASIC map pin image. */
  pinImageUrl?: string
  headline?: string
  details?: DetailsScreenContent
  recommendation?: RecommendationContent
  /** Opaque offer token for the on-tap assets call (fetchOfferDetails). */
  offerId?: string
}

/**
 * Whether tapping the offer's pin can open a details screen: either the content is
 * already merged, or the campaign delivered the DETAILS_SCREEN format (content then
 * arrives via the on-tap assets call). Pin-only campaigns open nothing.
 */
export function hasDetailsScreen(offer: PoiOffer): boolean {
  return offer.details !== undefined || offer.formats.includes('DETAILS_SCREEN')
}

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined

/** Prefers an English asset (offers can carry one entry per language). */
function pickAsset(assets: OfferAssetTO[], assetType: string): OfferAssetTO | undefined {
  const matching = assets.filter((asset) => asset.assetType === assetType && asset.content)
  return matching.find((asset) => asset.language.toLowerCase().startsWith('en')) ?? matching[0]
}

/** Maps a DETAILS_BASIC asset into the domain shape, if the offer carries one. */
function detailsContent(assets: OfferAssetTO[]): DetailsScreenContent | undefined {
  const details = pickAsset(assets, 'DETAILS_BASIC')?.content
  if (!details) return undefined
  return {
    headline: asString(details.headline),
    description: asString(details.description),
    brandLogoUrl: asString(details.brandLogoUrl),
    productImageUrl1: asString(details.productImageUrl1),
    productImageUrl2: asString(details.productImageUrl2),
    callToActions: Array.isArray(details.callToActions)
      ? details.callToActions
          .map((cta) => asString((cta as Record<string, unknown>)?.actionType))
          .filter((action): action is string => action !== undefined)
      : []
  }
}

function poiAddress(poi: OfferPoiTO): string | undefined {
  const street = [poi.street, poi.streetNumber].filter(Boolean).join(' ')
  const city = [poi.postalCode, poi.city].filter(Boolean).join(' ')
  const address = [street, city].filter(Boolean).join(', ')
  return address || undefined
}

/** Groups the raw offers by POI, merging pin and details-screen assets per location. */
export function mapOffersResponse(response: OffersResponseTO): PoiOffer[] {
  const byPoi = new Map<string, PoiOffer>()
  for (const offer of response.offers ?? []) {
    const poi = offer.poi
    if (!poi?.location) continue
    const id = poi.poiId ?? offer.offerId
    const existing = byPoi.get(id)
    const target: PoiOffer = existing ?? {
      id,
      name: poi.name,
      coord: [poi.location.longitude, poi.location.latitude],
      formats: [],
      address: poiAddress(poi),
      isOpen: poi.isCurrentlyOpen ?? poi.currentlyOpen ?? undefined,
      category: poi.categories?.[0],
      campaignId: offer.campaignId,
      organizationName: offer.organization?.organizationName ?? offer.organizationName
    }
    // the new API bundles secondary formats (e.g. DETAILS_SCREEN) into the main offer
    const delivered = [
      offer.adFormat,
      ...(offer.adFormatsWithAssets ?? []),
      ...(offer.additionalAdFormats ?? [])
    ]
    for (const format of delivered) {
      if (!target.formats.includes(format)) target.formats.push(format)
    }
    target.offerId = target.offerId ?? offer.offerId

    const assets = offer.assets ?? []
    const pin = pickAsset(assets, 'BRANDED_PIN_BASIC')?.content
    if (pin) {
      target.pinImageUrl = asString(pin.mapPinImageUrl) ?? target.pinImageUrl
      target.headline = asString(pin.headline) ?? target.headline
    }
    target.details = detailsContent(assets) ?? target.details
    const recommendation = pickAsset(assets, 'RECOMMENDATION_BASIC')?.content
    if (recommendation) {
      target.recommendation = {
        headline: asString(recommendation.headline),
        description: asString(recommendation.description),
        brandLogoImageUrl: asString(recommendation.brandLogoImageUrl)
      }
    }
    byPoi.set(id, target)
  }
  return [...byPoi.values()]
}

/**
 * Fetches offers of the selected ad formats around `center` ([lng, lat]). DETAILS_SCREEN
 * is always requested alongside: it provides the details view opened from a branded pin
 * or a recommendation. `recommendationTrigger` narrows RECOMMENDATION offers to campaigns
 * targeting that vehicle trigger (the service accepts at most one trigger per request).
 */
export async function fetchNearbyOffers(
  center: LngLat,
  adFormats: OfferAdFormat[],
  radiusInMeter = OFFERS_MAX_RADIUS_M,
  limit = 20,
  recommendationTrigger?: RecommendationTrigger
): Promise<PoiOffer[]> {
  const requested = [...new Set([...adFormats, 'DETAILS_SCREEN'])]
  const response = await fetch(OFFERS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Brand: BRAND,
      'Asset-Consumer-Id': ASSET_CONSUMER_ID,
      Currency: 'EUR',
      'Offer-Language': 'en-us,en'
    },
    body: JSON.stringify({
      deviceId: DEVICE_ID,
      area: {
        type: 'Feature',
        // the service expects [latitude, longitude], the reverse of our LngLat
        geometry: { type: 'Point', coordinates: [center[1], center[0]] },
        properties: {
          radiusInMeter: Math.min(
            Math.max(Math.round(radiusInMeter), OFFERS_MIN_RADIUS_M),
            OFFERS_MAX_RADIUS_M
          )
        }
      },
      adFormats: requested.map((adFormatType) =>
        adFormatType === 'RECOMMENDATION' && recommendationTrigger
          ? { adFormatType, triggers: [recommendationTrigger] }
          : { adFormatType }
      ),
      limit
    })
  })
  if (!response.ok) throw new Error(`Offers request failed with ${response.status}`)
  return mapOffersResponse((await response.json()) as OffersResponseTO)
}

/**
 * Fetches the full asset set for one offer (GET /api/supply/v1/offers/assets) and returns
 * its details-screen content — the production flow for opening a details screen from a
 * branded pin: pins stay lightweight and details assets are only retrieved (and counted)
 * on tap. NOTE: unlike /internal/offers this endpoint sits behind the API gateway's auth;
 * hit directly in the dev cluster it currently answers 403, so callers must treat a
 * failure as "no details" and fall back to the nearby-response content.
 */
export async function fetchOfferDetails(
  offerId: string
): Promise<DetailsScreenContent | undefined> {
  const response = await fetch(`${OFFER_ASSETS_ENDPOINT}?offerId=${encodeURIComponent(offerId)}`, {
    headers: { 'Offer-Language': 'en-us,en' }
  })
  if (!response.ok) throw new Error(`Offer assets request failed with ${response.status}`)
  const body = (await response.json()) as { assets?: OfferAssetTO[] }
  return detailsContent(body.assets ?? [])
}
