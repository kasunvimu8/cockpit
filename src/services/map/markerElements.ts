import type { CampaignRegion } from '../../data/campaigns'
import type { ViewMode } from '../../store/simulationStore'

const CAR_SVG_CLASSES = 'h-11 w-6 drop-shadow-[0_3px_5px_#00000055] group-data-[mode=2d]:hidden'
const PUCK_CLASSES =
  'hidden h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-[#3c4257] shadow-[0_4px_14px_#00000059] group-data-[mode=2d]:flex'
const HALO_CLASSES =
  'pointer-events-none absolute left-1/2 top-1/2 -ml-6.5 -mt-6.5 h-13 w-13 animate-halo rounded-full bg-[#2470d82e]'

/**
 * Vehicle marker containing both representations: a top-down car for 3D chase view and a
 * navigation puck (dark disc with a white arrow) for 2D view. `setCarPuckMode` toggles.
 */
export function createCarPuckElement(): HTMLElement {
  const wrap = document.createElement('div')
  wrap.className = 'group relative flex h-12 w-11 items-center justify-center'
  wrap.dataset.mode = '3d'
  wrap.innerHTML = `
    <div class="${HALO_CLASSES}"></div>
    <svg class="${CAR_SVG_CLASSES}" viewBox="0 0 26 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 1 C19 1 23 4 23.5 10 L24 32 C24 40 20 46 13 46 C6 46 2 40 2 32 L2.5 10 C3 4 7 1 13 1 Z"
        fill="#d23b2e" stroke="#8f2018" stroke-width="1"/>
      <path d="M5.5 12 C8 9.5 18 9.5 20.5 12 L19.5 19 C15 17 11 17 6.5 19 Z" fill="#22262c"/>
      <path d="M6 30 C10 28.5 16 28.5 20 30 L19.5 37 C15.5 35.5 10.5 35.5 6.5 37 Z" fill="#33383f"/>
      <rect x="4.5" y="1.5" width="4" height="3" rx="1.4" fill="#f7e9c8"/>
      <rect x="17.5" y="1.5" width="4" height="3" rx="1.4" fill="#f7e9c8"/>
      <rect x="5" y="43.5" width="16" height="2.4" rx="1.2" fill="#7e1410"/>
    </svg>
    <div class="${PUCK_CLASSES}">
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.6 L19.4 20.4 L12 16.4 L4.6 20.4 Z" fill="#fff"/>
      </svg>
    </div>`
  return wrap
}

export function setCarPuckMode(element: HTMLElement, mode: ViewMode): void {
  if (element.dataset.mode !== mode) element.dataset.mode = mode
}

/** Teardrop pin carrying the campaign icon in the campaign's brand colour. */
export function createCampaignPinElement(region: CampaignRegion): HTMLElement {
  const pin = document.createElement('div')
  pin.className =
    'flex h-7.5 w-7.5 -rotate-45 items-center justify-center rounded-[50%_50%_50%_0] border-[2.5px] border-white shadow-[0_3px_10px_#00000033]'
  pin.style.background = region.color
  const icon = document.createElement('span')
  icon.className = 'rotate-45 text-[13px]'
  icon.textContent = region.icon
  pin.appendChild(icon)
  return pin
}

/** Chequered-flag disc for the active navigation destination. */
export function createDestinationFlagElement(): HTMLElement {
  const flag = document.createElement('div')
  flag.className =
    'flex h-7 w-7 items-center justify-center rounded-full border-[2.5px] border-white bg-[#26292e] text-xs text-white shadow-[0_3px_10px_#00000040]'
  flag.textContent = '🏁'
  return flag
}
