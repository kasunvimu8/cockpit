/** Pixel geometry of the cockpit photo and the in-dash display within it. */
export interface BackdropImage {
  width: number
  height: number
  /** Centre of the in-dash display slab inside the photo, in image pixels. */
  displayCenterX: number
  displayCenterY: number
  /** Size of the visible display slab (glass, housing and recess), in image pixels. */
  displayWidth: number
  displayHeight: number
}

/** Where and how large the photo must be drawn, in viewport pixels. */
export interface BackdropLayout {
  width: number
  height: number
  left: number
  top: number
}

/**
 * Measured from the photo: the display assembly as perceived (glass, housing and the dark
 * recess down to the chrome dash trim) spans x 315–1249 and y 155–742 in image pixels.
 */
export const COCKPIT_BACKDROP: BackdropImage = {
  width: 1536,
  height: 1024,
  displayCenterX: 783,
  displayCenterY: 449,
  displayWidth: 934,
  displayHeight: 587
}

const HEAD_UNIT_MAX_BASE_WIDTH_PX = 1040
const HEAD_UNIT_VIEWPORT_FRACTION = 0.88
export const HEAD_UNIT_ASPECT = 16 / 9.4
/** Extra head-unit size so it overlaps slightly past the display-slab edges. */
const COVER_MARGIN = 1.02
/** The head unit never exceeds these viewport fractions, even to cover the slab. */
const MAX_VIEWPORT_WIDTH_FRACTION = 0.98
const MAX_VIEWPORT_HEIGHT_FRACTION = 0.96

/** Minimal scale that pins the display centre to the viewport centre with full coverage. */
function coverageScale(viewportWidth: number, viewportHeight: number, image: BackdropImage) {
  return Math.max(
    viewportWidth / (2 * image.displayCenterX),
    viewportWidth / (2 * (image.width - image.displayCenterX)),
    viewportHeight / (2 * image.displayCenterY),
    viewportHeight / (2 * (image.height - image.displayCenterY))
  )
}

/**
 * Scales and offsets the photo so its display-slab centre lands exactly on the viewport
 * centre (where the head unit is rendered) while covering the whole viewport.
 */
export function computeBackdropLayout(
  viewportWidth: number,
  viewportHeight: number,
  image: BackdropImage = COCKPIT_BACKDROP
): BackdropLayout {
  const scale = coverageScale(viewportWidth, viewportHeight, image)
  return {
    width: image.width * scale,
    height: image.height * scale,
    left: viewportWidth / 2 - image.displayCenterX * scale,
    top: viewportHeight / 2 - image.displayCenterY * scale
  }
}

/**
 * Head-unit width: the regular responsive size, enlarged when necessary so the unit fully
 * covers the photo's display slab, and clamped so it always fits the viewport.
 */
export function computeHeadUnitWidth(
  viewportWidth: number,
  viewportHeight: number,
  image: BackdropImage = COCKPIT_BACKDROP
): number {
  const base = Math.min(HEAD_UNIT_VIEWPORT_FRACTION * viewportWidth, HEAD_UNIT_MAX_BASE_WIDTH_PX)
  const scale = coverageScale(viewportWidth, viewportHeight, image)
  const coverSlabWidth = COVER_MARGIN * image.displayWidth * scale
  const coverSlabHeightAsWidth = COVER_MARGIN * image.displayHeight * scale * HEAD_UNIT_ASPECT
  return Math.min(
    Math.max(base, coverSlabWidth, coverSlabHeightAsWidth),
    MAX_VIEWPORT_WIDTH_FRACTION * viewportWidth,
    MAX_VIEWPORT_HEIGHT_FRACTION * viewportHeight * HEAD_UNIT_ASPECT
  )
}
