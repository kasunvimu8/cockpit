import { expect, test } from 'vitest'
import type { OffersResponseTO } from './offersClient'
import { mapOffersResponse } from './offersClient'

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

test('prefers the English asset when multiple languages are present', () => {
  const offers = mapOffersResponse({ offers: [detailsOffer] } as OffersResponseTO)
  expect(offers[0].details?.headline).toBe('Fresh deals')
})

test('skips offers without a POI location and tolerates an empty response', () => {
  expect(mapOffersResponse({})).toEqual([])
  expect(
    mapOffersResponse({ offers: [{ adFormat: 'BRANDED_PIN', offerId: 'x' }] } as OffersResponseTO)
  ).toEqual([])
})
