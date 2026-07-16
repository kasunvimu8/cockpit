import { CockpitFrame } from './features/cockpit/CockpitFrame'
import { HeadUnit } from './features/headUnit/HeadUnit'
import { Launcher } from './features/headUnit/Launcher'
import { TopBar } from './features/headUnit/TopBar'
import { DestinationMarker } from './features/map/DestinationMarker'
import { MapProvider } from './features/map/MapContext'
import { MapPanel } from './features/map/MapPanel'
import { MapView } from './features/map/MapView'
import { RecenterButton } from './features/map/RecenterButton'
import { RouteLayer } from './features/map/RouteLayer'
import { ZoomControls } from './features/map/ZoomControls'
import { DirectionsPanel } from './features/navigation/DirectionsPanel'
import { EtaBar } from './features/navigation/EtaBar'
import { ManeuverBanner } from './features/navigation/ManeuverBanner'
import { RoutePreviewCard } from './features/navigation/RoutePreviewCard'
import { SearchPanel } from './features/navigation/SearchPanel'
import { DetailsScreenPanel } from './features/offers/DetailsScreenPanel'
import { OffersLayer } from './features/offers/OffersLayer'
import { SettingsButton } from './features/settings/SettingsButton'
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
        <TopBar />
        <MapProvider>
          <MapPanel>
            <MapView />
            <SimulationController />
            <DestinationMarker />
            <RouteLayer />
            <OffersLayer />
            <SearchPanel />
            <DirectionsPanel />
            <ManeuverBanner />
            <RoutePreviewCard />
            <DetailsScreenPanel />
            <EtaBar />
            <SpeedChip />
            <ZoomControls />
            <RecenterButton />
            <SettingsButton />
            <Toast />
            <SettingsPanel />
          </MapPanel>
        </MapProvider>
        <Launcher />
      </HeadUnit>
    </CockpitFrame>
  )
}
