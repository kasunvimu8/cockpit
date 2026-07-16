import { CockpitFrame } from './features/cockpit/CockpitFrame'
import { HeadUnit } from './features/headUnit/HeadUnit'
import { Launcher } from './features/headUnit/Launcher'
import { Logo } from './features/headUnit/Logo'
import { StatusIndicators } from './features/headUnit/StatusIndicators'
import { DestinationMarker } from './features/map/DestinationMarker'
import { FloatingControls } from './features/map/FloatingControls'
import { MapProvider } from './features/map/MapContext'
import { MapPanel } from './features/map/MapPanel'
import { MapView } from './features/map/MapView'
import { RouteLayer } from './features/map/RouteLayer'
import { DirectionsPanel } from './features/navigation/DirectionsPanel'
import { EtaBar } from './features/navigation/EtaBar'
import { ManeuverBanner } from './features/navigation/ManeuverBanner'
import { RoutePreviewCard } from './features/navigation/RoutePreviewCard'
import { SearchPanel } from './features/navigation/SearchPanel'
import { DetailsScreenPanel } from './features/offers/DetailsScreenPanel'
import { OffersLayer } from './features/offers/OffersLayer'
import { RecommendationCard } from './features/offers/RecommendationCard'
import { RecommendationScheduler } from './features/offers/RecommendationScheduler'
import { SettingsPanel } from './features/settings/SettingsPanel'
import { useApplyTheme } from './features/settings/useApplyTheme'
import { SimulationController } from './features/simulation/SimulationController'
import { SpeedChip } from './features/simulation/SpeedChip'
import { Toast } from './shared/components/Toast'

export function App() {
  useApplyTheme()

  return (
    <CockpitFrame>
      <HeadUnit>
        <MapProvider>
          <MapPanel>
            <MapView />
            <SimulationController />
            <DestinationMarker />
            <RouteLayer />
            <OffersLayer />
            <Logo />
            <StatusIndicators />
            <FloatingControls />
            <SearchPanel />
            <DirectionsPanel />
            <ManeuverBanner />
            <RoutePreviewCard />
            <RecommendationScheduler />
            <RecommendationCard />
            <DetailsScreenPanel />
            <EtaBar />
            <SpeedChip />
            <Toast />
            <SettingsPanel />
          </MapPanel>
        </MapProvider>
        <Launcher />
      </HeadUnit>
    </CockpitFrame>
  )
}
