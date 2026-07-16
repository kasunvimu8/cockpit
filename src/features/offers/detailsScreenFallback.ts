import type { DetailsScreenContent } from '../../services/offers/offersClient'

/**
 * Dev-only DETAILS_BASIC stand-in: the dev campaign currently only delivers BRANDED_PIN
 * assets, so live offers arrive without `details` content. This fallback lets the details
 * screen be built and demoed end-to-end until the campaign carries real details assets.
 * Assets are inline SVG data URIs so the panel renders without any network dependency.
 */

const svgUrl = (markup: string) => `data:image/svg+xml,${encodeURIComponent(markup)}`

/** App-icon style brand logo: green charging bolt on a navy rounded tile. */
const BRAND_LOGO = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
    <rect width="96" height="96" rx="22" fill="#242a63"/>
    <path d="M54 12 26 54h17l-7 30 34-46H53l9-26z" fill="#39d353"/>
  </svg>`
)

/** Wide hero banner mimicking the campaign creative (headline, discount, brand). */
const PRODUCT_IMAGE = svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" font-family="system-ui, sans-serif">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#a5d3dc"/>
        <stop offset="0.7" stop-color="#5d98a0"/>
        <stop offset="1" stop-color="#4d7f68"/>
      </linearGradient>
    </defs>
    <rect width="640" height="300" fill="url(#sky)"/>
    <rect x="472" y="88" width="44" height="150" rx="8" fill="#8f979e"/>
    <rect x="480" y="100" width="28" height="46" rx="4" fill="#1c2126"/>
    <text x="36" y="104" font-size="42" font-weight="700" fill="#ffffff">Charge into a</text>
    <text x="36" y="152" font-size="42" font-weight="700" fill="#3ddc55">Greener Horizon</text>
    <text x="36" y="244" font-size="22" font-weight="600" fill="#ffffff">Save <tspan fill="#3ddc55">20%</tspan> on every charge</text>
    <text x="36" y="278" font-size="18" font-weight="600" fill="#ffffff">&#9889; Prime<tspan fill="#3ddc55">Volt</tspan></text>
  </svg>`
)

export const DEV_DETAILS_FALLBACK: DetailsScreenContent = {
  headline: 'Charge into a Greener Horizon',
  description:
    'Fast charging on 100% renewable energy. Save 20% on every charge with the PrimeVolt app — plug in, relax and be back on the road in minutes.',
  brandLogoUrl: BRAND_LOGO,
  productImageUrl1: PRODUCT_IMAGE,
  callToActions: ['START_NAVIGATION']
}
