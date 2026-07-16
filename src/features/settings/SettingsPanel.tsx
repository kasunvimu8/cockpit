import { useEffect, useRef, useState } from 'react'
import { OFFERS_MAX_RADIUS_M, OFFERS_MIN_RADIUS_M } from '../../services/offers/offersClient'
import type { Theme } from '../../store/settingsStore'
import {
  RECOMMENDATION_DELAY_MAX_S,
  RECOMMENDATION_DELAY_MIN_S,
  useSettingsStore
} from '../../store/settingsStore'
import type { ViewMode } from '../../store/simulationStore'
import {
  SPEED_MAX_KMH,
  SPEED_MIN_KMH,
  SPEED_STEP_KMH,
  useSimulationStore
} from '../../store/simulationStore'
import { AdFormatSelect } from './AdFormatSelect'
import { RecommendationTriggerSelect } from './RecommendationTriggerSelect'

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' }
]

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
]

const SEGMENT_BASE =
  'cursor-pointer rounded-[7px] border px-3.5 py-[5px] font-sans text-[11.5px] font-semibold transition-all'
const SEGMENT_IDLE = `${SEGMENT_BASE} border-transparent bg-transparent text-muted hover:text-text`
const SEGMENT_ACTIVE = `${SEGMENT_BASE} border-[#2470d833] bg-active-bg text-accent`

/** Platform settings, presented as a slide-in side panel on the right. */
export function SettingsPanel() {
  const open = useSettingsStore((state) => state.panelOpen)
  const closePanel = useSettingsStore((state) => state.closePanel)
  const theme = useSettingsStore((state) => state.theme)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const offersRadiusM = useSettingsStore((state) => state.offersRadiusM)
  const setOffersRadiusM = useSettingsStore((state) => state.setOffersRadiusM)
  const offersAdFormats = useSettingsStore((state) => state.offersAdFormats)
  const recommendationDelayS = useSettingsStore((state) => state.recommendationDelayS)
  const setRecommendationDelayS = useSettingsStore((state) => state.setRecommendationDelayS)
  const speedKmh = useSimulationStore((state) => state.speedKmh)
  const setSpeedKmh = useSimulationStore((state) => state.setSpeedKmh)
  const viewMode = useSimulationStore((state) => state.viewMode)
  const setViewMode = useSimulationStore((state) => state.setViewMode)
  const panelRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) closePanel()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, closePanel])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-9 bg-black/30">
      <div
        ref={panelRef}
        className={`absolute bottom-0 right-0 top-0 w-[340px] max-w-[80%] overflow-y-auto border-l border-line bg-screen px-5 pb-5 pt-4.5 shadow-[-16px_0_40px_#00000040] transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Settings"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-text">Settings</h2>
          <button
            type="button"
            className="h-7 w-7 cursor-pointer rounded-lg border-none bg-transparent text-[13px] text-muted transition-colors hover:bg-hover"
            aria-label="Close settings"
            onClick={closePanel}
          >
            ✕
          </button>
        </div>

        <section className="border-t border-line pb-1 pt-2.5">
          <h3 className="mb-2.5 text-[10px] uppercase tracking-[0.12em] text-muted">Simulation</h3>
          <div className="flex items-center justify-between gap-4 pb-3 pt-1.5">
            <span className="text-[12.5px] text-text">Target speed</span>
            <div className="flex items-center gap-2.5">
              <input
                type="range"
                className="h-[3px] w-30 accent-accent"
                min={SPEED_MIN_KMH}
                max={SPEED_MAX_KMH}
                step={SPEED_STEP_KMH}
                value={speedKmh}
                aria-label="Target speed"
                onChange={(event) => setSpeedKmh(Number(event.target.value))}
              />
              <span className="min-w-[62px] text-right font-mono text-xs text-text">
                {speedKmh} km/h
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 pb-3 pt-1.5">
            <span className="text-[12.5px] text-text">Camera view</span>
            <div className="flex gap-1 rounded-[10px] border border-line bg-chip p-[3px]">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={mode.value === viewMode ? SEGMENT_ACTIVE : SEGMENT_IDLE}
                  onClick={() => setViewMode(mode.value)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line pb-1 pt-2.5">
          <h3 className="mb-2.5 text-[10px] uppercase tracking-[0.12em] text-muted">Offers</h3>
          <div className="flex items-center justify-between gap-4 pb-3 pt-1.5">
            <span className="text-[12.5px] text-text">Search radius</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                className="w-18 rounded-lg border border-line bg-chip px-2 py-[7px] text-right font-mono text-xs text-text"
                min={OFFERS_MIN_RADIUS_M / 1000}
                max={OFFERS_MAX_RADIUS_M / 1000}
                step={0.5}
                value={offersRadiusM / 1000}
                aria-label="Offers search radius in kilometres"
                onChange={(event) => setOffersRadiusM(Number(event.target.value) * 1000)}
              />
              <span className="text-xs text-muted">km</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 pb-3 pt-1.5">
            <span className="text-[12.5px] text-text">Ad formats</span>
            <AdFormatSelect />
          </div>
          {offersAdFormats.includes('RECOMMENDATION') && (
            <>
              <div className="flex items-center justify-between gap-4 pb-3 pt-1.5 pl-3">
                <span className="text-[12.5px] text-muted">Triggers</span>
                <RecommendationTriggerSelect />
              </div>
              <div className="flex items-center justify-between gap-4 pb-3 pt-1.5 pl-3">
                <span className="text-[12.5px] text-muted">Trigger after</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    className="w-18 rounded-lg border border-line bg-chip px-2 py-[7px] text-right font-mono text-xs text-text"
                    min={RECOMMENDATION_DELAY_MIN_S}
                    max={RECOMMENDATION_DELAY_MAX_S}
                    step={5}
                    value={recommendationDelayS}
                    aria-label="Recommendation trigger delay in seconds"
                    onChange={(event) => setRecommendationDelayS(Number(event.target.value))}
                  />
                  <span className="text-xs text-muted">s</span>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="border-t border-line pb-1 pt-2.5">
          <h3 className="mb-2.5 text-[10px] uppercase tracking-[0.12em] text-muted">Appearance</h3>
          <div className="flex items-center justify-between gap-4 pb-3 pt-1.5">
            <span className="text-[12.5px] text-text">Theme</span>
            <div className="flex gap-1 rounded-[10px] border border-line bg-chip p-[3px]">
              {THEMES.map((candidate) => (
                <button
                  key={candidate.value}
                  type="button"
                  className={candidate.value === theme ? SEGMENT_ACTIVE : SEGMENT_IDLE}
                  onClick={() => setTheme(candidate.value)}
                >
                  {candidate.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
