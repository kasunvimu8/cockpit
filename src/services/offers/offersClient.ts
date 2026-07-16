import type { LngLat } from '../../shared/lib/geo'

/**
 * Client for the supply-provisioning-service internal offers endpoint
 * (POST /api/supply/v1/internal/offers, proxied by Vite to avoid CORS — no auth needed).
 * Fetches BRANDED_PIN and DETAILS_SCREEN offers around a position and maps them into
 * per-POI domain objects for the head unit.
 */

const OFFERS_ENDPOINT = '/api/supply/v1/internal/offers'
const DEVICE_ID = 'WDBRF40J43F433102'
/** The service rejects radii above 30 km. */
export const OFFERS_MAX_RADIUS_M = 30000
export const OFFERS_MIN_RADIUS_M = 500

/** Ad formats the driver can enable in the settings panel. */
export type OfferAdFormat = 'BRANDED_PIN' | 'RECOMMENDATION' | 'SEARCH'

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
  streetNumber?: string
  postalCode?: string
  city?: string
  categories?: string[]
  isCurrentlyOpen?: boolean
}

interface OfferTO {
  adFormat: string
  offerId: string
  campaignId?: string
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
}

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined

/** Prefers an English asset (offers can carry one entry per language). */
function pickAsset(assets: OfferAssetTO[], assetType: string): OfferAssetTO | undefined {
  const matching = assets.filter((asset) => asset.assetType === assetType && asset.content)
  return matching.find((asset) => asset.language.toLowerCase().startsWith('en')) ?? matching[0]
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
      isOpen: poi.isCurrentlyOpen,
      category: poi.categories?.[0],
      campaignId: offer.campaignId,
      organizationName: offer.organization?.organizationName ?? offer.organizationName
    }
    if (!target.formats.includes(offer.adFormat)) target.formats.push(offer.adFormat)

    const assets = offer.assets ?? []
    const pin = pickAsset(assets, 'BRANDED_PIN_BASIC')?.content
    if (pin) {
      target.pinImageUrl = asString(pin.mapPinImageUrl) ?? target.pinImageUrl
      target.headline = asString(pin.headline) ?? target.headline
    }
    const details = pickAsset(assets, 'DETAILS_BASIC')?.content
    if (details) {
      target.details = {
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
    byPoi.set(id, target)
  }
  return [...byPoi.values()]
}

/**
 * Fetches offers of the selected ad formats around `center` ([lng, lat]). DETAILS_SCREEN
 * is always requested alongside: it provides the details view opened from a branded pin.
 */
export async function fetchNearbyOffers(
  center: LngLat,
  adFormats: OfferAdFormat[],
  radiusInMeter = OFFERS_MAX_RADIUS_M,
  limit = 20
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
      adFormats: requested.map((adFormatType) => ({ adFormatType })),
      limit
    })
  })
  if (!response.ok) throw new Error(`Offers request failed with ${response.status}`)
  return mapOffersResponse((await response.json()) as OffersResponseTO)
}
