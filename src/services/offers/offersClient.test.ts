import { expect, test } from 'vitest'
import type { OffersResponseTO } from './offersClient'
import { hasDetailsScreen, mapOffersResponse } from './offersClient'

const poi = {
  poiId: 'poi-1',
  name: 'Aldi',
  location: { latitude: 48.105, longitude: 11.597 },
  street: 'Schwanseestraße',
  streetNumber: '61',
  postalCode: '81549',
  city: 'München',
  categories: ['SUPERMARKET'],
  isCurrentlyOpen: true
}

const brandedPinOffer = {
  adFormat: 'BRANDED_PIN',
  offerId: 'offer-bp',
  campaignId: 'campaign-1',
  organization: { organizationName: 'Acme Org' },
  poi,
  assets: [
    {
      adFormatType: 'BRANDED_PIN',
      assetType: 'BRANDED_PIN_BASIC',
      language: 'en',
      content: { mapPinImageUrl: 'https://cdn/pin.png', mapPin3dUrl: 'https://cdn/pin.glb' }
    }
  ]
}

const detailsOffer = {
  adFormat: 'DETAILS_SCREEN',
  offerId: 'offer-ds',
  poi,
  assets: [
    {
      adFormatType: 'DETAILS_SCREEN',
      assetType: 'DETAILS_BASIC',
      language: 'de',
      content: { headline: 'Deutsch', description: 'de', callToActions: [] }
    },
    {
      adFormatType: 'DETAILS_SCREEN',
      assetType: 'DETAILS_BASIC',
      language: 'en',
      content: {
        headline: 'Fresh deals',
        description: 'Save today',
        brandLogoUrl: 'https://cdn/logo.png',
        productImageUrl1: 'https://cdn/product.png',
        callToActions: [{ actionType: 'START_NAVIGATION' }]
      }
    }
  ]
}

test('maps a branded pin offer to a PoiOffer with [lng, lat] coordinates', () => {
  const offers = mapOffersResponse({ offers: [brandedPinOffer] } as OffersResponseTO)
  expect(offers).toHaveLength(1)
  expect(offers[0]).toMatchObject({
    id: 'poi-1',
    name: 'Aldi',
    coord: [11.597, 48.105],
    formats: ['BRANDED_PIN'],
    address: 'Schwanseestraße 61, 81549 München',
    isOpen: true,
    category: 'SUPERMARKET',
    campaignId: 'campaign-1',
    organizationName: 'Acme Org',
    pinImageUrl: 'https://cdn/pin.png'
  })
  expect(offers[0].details).toBeUndefined()
})

test('merges branded pin and details screen offers on the same POI', () => {
  const offers = mapOffersResponse({
    offers: [brandedPinOffer, detailsOffer]
  } as OffersResponseTO)
  expect(offers).toHaveLength(1)
  expect(offers[0].formats).toEqual(['BRANDED_PIN', 'DETAILS_SCREEN'])
  expect(offers[0].pinImageUrl).toBe('https://cdn/pin.png')
  expect(offers[0].details).toEqual({
    headline: 'Fresh deals',
    description: 'Save today',
    brandLogoUrl: 'https://cdn/logo.png',
    productImageUrl1: 'https://cdn/product.png',
    productImageUrl2: undefined,
    callToActions: ['START_NAVIGATION']
  })
})

test('maps details-screen assets bundled into a branded pin offer (new API shape)', () => {
  const bundledOffer = {
    ...brandedPinOffer,
    adFormatsWithAssets: ['BRANDED_PIN', 'DETAILS_SCREEN'],
    additionalAdFormats: ['DETAILS_SCREEN'],
    assets: [...brandedPinOffer.assets, ...detailsOffer.assets]
  }
  const offers = mapOffersResponse({ offers: [bundledOffer] } as OffersResponseTO)
  expect(offers).toHaveLength(1)
  expect(offers[0].formats).toEqual(['BRANDED_PIN', 'DETAILS_SCREEN'])
  expect(offers[0].pinImageUrl).toBe('https://cdn/pin.png')
  expect(offers[0].details?.headline).toBe('Fresh deals')
})

test('maps RECOMMENDATION_BASIC content into the recommendation field', () => {
  const recommendationOffer = {
    adFormat: 'RECOMMENDATION',
    offerId: 'offer-rec',
    adFormatsWithAssets: ['RECOMMENDATION', 'DETAILS_SCREEN'],
    poi,
    assets: [
      {
        adFormatType: 'RECOMMENDATION',
        assetType: 'RECOMMENDATION_BASIC',
        language: 'en',
        content: {
          brandLogoImageUrl: 'https://cdn/rec-logo.png',
          headline: 'Save 20% Every Charg',
          description: 'Fast, reliable EV charging wit'
        }
      },
      ...detailsOffer.assets
    ]
  }
  const offers = mapOffersResponse({ offers: [recommendationOffer] } as OffersResponseTO)
  expect(offers).toHaveLength(1)
  expect(offers[0].formats).toEqual(['RECOMMENDATION', 'DETAILS_SCREEN'])
  expect(offers[0].recommendation).toEqual({
    headline: 'Save 20% Every Charg',
    description: 'Fast, reliable EV charging wit',
    brandLogoImageUrl: 'https://cdn/rec-logo.png'
  })
  expect(offers[0].details?.headline).toBe('Fresh deals')
})

test('prefers the English asset when multiple languages are present', () => {
  const offers = mapOffersResponse({ offers: [detailsOffer] } as OffersResponseTO)
  expect(offers[0].details?.headline).toBe('Fresh deals')
})

/**
 * Modelled on a real dev-campaign offer ("Load Testing Inc."): one BRANDED_PIN offer
 * carrying its DETAILS_SCREEN assets inline (additionalAdFormats), with the GraphQL
 * field variants (currentlyOpen/streetNumber null) and a DETAILS_BASIC content that
 * has no callToActions or productImageUrl2.
 */
test('maps a branded pin offer with inline details assets and GraphQL field variants', () => {
  const offers = mapOffersResponse({
    offers: [
      {
        adFormat: 'BRANDED_PIN',
        offerId: 'opaque-token',
        campaignId: '8550a899-581c-419c-b95f-e3aeca79f2b0',
        organization: { organizationName: 'Load Testing Inc.' },
        poi: {
          poiId: '93f2948f-c598-46e7-9c60-9342c2d98093',
          name: 'Benecke-Tonn 9420',
          location: { latitude: 48.18278, longitude: 11.56933 },
          street: 'Okerstr. 30b',
          streetNumber: null,
          postalCode: '24979',
          city: 'Ost Talea',
          categories: ['MARKETS_AND_FOOD_STORES'],
          currentlyOpen: null
        },
        assets: [
          {
            adFormatType: 'DETAILS_SCREEN',
            assetType: 'DETAILS_BASIC',
            language: 'en',
            content: {
              headline: 'Test Headline',
              description: 'Test description.',
              brandLogoUrl: 'https://cdn/brandLogoUrl.png',
              productImageUrl1: 'https://cdn/productImageUrl1.png'
            }
          },
          {
            adFormatType: 'BRANDED_PIN',
            assetType: 'BRANDED_PIN_BASIC',
            language: 'en',
            content: { mapPinImageUrl: 'https://cdn/mapPinImageUrl.png' }
          }
        ]
      }
    ]
  } as OffersResponseTO)
  expect(offers).toHaveLength(1)
  expect(offers[0]).toMatchObject({
    id: '93f2948f-c598-46e7-9c60-9342c2d98093',
    formats: ['BRANDED_PIN'],
    offerId: 'opaque-token',
    address: 'Okerstr. 30b, 24979 Ost Talea',
    pinImageUrl: 'https://cdn/mapPinImageUrl.png'
  })
  // currentlyOpen: null means "unknown" — the open/closed badge must stay hidden
  expect(offers[0].isOpen).toBeUndefined()
  expect(offers[0].details).toEqual({
    headline: 'Test Headline',
    description: 'Test description.',
    brandLogoUrl: 'https://cdn/brandLogoUrl.png',
    productImageUrl1: 'https://cdn/productImageUrl1.png',
    productImageUrl2: undefined,
    callToActions: []
  })
})

test('maps the GraphQL currentlyOpen flag when the REST one is absent', () => {
  const offers = mapOffersResponse({
    offers: [
      {
        adFormat: 'BRANDED_PIN',
        offerId: 'x',
        poi: { ...poi, isCurrentlyOpen: undefined, currentlyOpen: false }
      }
    ]
  } as OffersResponseTO)
  expect(offers[0].isOpen).toBe(false)
})

test('hasDetailsScreen distinguishes pin-only offers from ones with details', () => {
  const [pinOnly] = mapOffersResponse({ offers: [brandedPinOffer] } as OffersResponseTO)
  expect(hasDetailsScreen(pinOnly)).toBe(false)
  const [withDetails] = mapOffersResponse({
    offers: [brandedPinOffer, detailsOffer]
  } as OffersResponseTO)
  expect(hasDetailsScreen(withDetails)).toBe(true)
  // DETAILS_SCREEN delivered as a format without bundled content (on-tap fetch case)
  expect(
    hasDetailsScreen({
      id: 'x',
      name: 'x',
      coord: [0, 0],
      formats: ['BRANDED_PIN', 'DETAILS_SCREEN']
    })
  ).toBe(true)
})

test('skips offers without a POI location and tolerates an empty response', () => {
  expect(mapOffersResponse({})).toEqual([])
  expect(
    mapOffersResponse({ offers: [{ adFormat: 'BRANDED_PIN', offerId: 'x' }] } as OffersResponseTO)
  ).toEqual([])
})
