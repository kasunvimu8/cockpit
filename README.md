# In-Car Cockpit — Navigation Simulation Platform

A production-grade in-car infotainment simulator built with React 19 + TypeScript. A
photographic cockpit frames a head unit running a Google-Maps-style navigation experience:
the vehicle starts at your real location, you plan a trip with editable start/destination,
preview the whole journey, then drive it with live turn-by-turn guidance on a 3D Google
map — all simulated, all in the browser.

![Stack](https://img.shields.io/badge/React_19-TypeScript-blue)
![Map](https://img.shields.io/badge/Google_Maps-vector-green)
![Styling](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8)

## Getting started

```bash
npm install
cp .env.example .env.local   # paste your Google Maps API key
npm run dev                  # http://localhost:3000
```

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server on port 3000 |
| `npm run build` | Type check + production build to `dist/` |
| `npm run preview` | Serve the production bundle on port 3000 |
| `npm test` | Vitest in watch mode |
| `npm run test:run` | Run the unit test suite once |
| `npm run lint` / `lint:fix` | Biome lint + format |

**Node 20+** recommended. Runtime network access is needed for map tiles, Google APIs and
routing (`router.project-osrm.org`); everything degrades gracefully when unreachable.

### Environment variables (`.env.local`)

| Variable | Purpose |
|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps Platform key. Needs **Maps JavaScript API** and **Places API (New)** enabled, with your origin (e.g. `http://localhost:3000/*`) in the key's website restrictions. When empty, the app falls back to MapLibre/OpenFreeMap and an offline destination list. |
| `VITE_GOOGLE_MAPS_MAP_ID` | Optional vector Map ID for cloud styling. Defaults to `DEMO_MAP_ID`. |

The dev server restarts automatically when `.env.local` changes. If Google rejects the key
at runtime (referrer/API restrictions), the app shows a notice and continues on the
MapLibre fallback instead of breaking.

## Feature tour

- **Photographic cockpit** — a real dashboard photo frames the head unit. The backdrop is
  scaled/offset at every viewport size so its in-dash display sits exactly behind the
  rendered screen (`features/cockpit/backdropTransform.ts`), and the head unit sizes
  itself to always cover the photo's display slab.
- **Starts at your location** — browser geolocation on boot (like Google Maps); falls back
  to a default Munich position with a notice when denied/unavailable. The vehicle rests
  parked until you start a trip.
- **Place search** — Google Places autocomplete (debounced, session-token billed, biased
  around the vehicle). No API key? An offline destination list serves as fallback.
- **Directions panel (route preview)** — after picking a destination the search bar becomes
  a Google-style directions editor: editable **starting point** (defaults to "Your
  location", never persisted) and **destination**, plus a ⇅ **swap** button. Any edit
  re-plans the route.
- **Journey overview** — the camera animates out to a top-down overview framing the whole
  route (blue line with white casing), with a preview card showing ETA (`2 hr 5 min`
  style), distance and **Start** / **Cancel**.
- **Turn-by-turn navigation** — pressing Start eases the camera back into a 3D chase view
  and drives the route. A green **maneuver banner** (top-left) shows the next turn from
  real OSRM step data (arrow, live countdown, street name); the bottom **ETA bar** shows
  remaining time/distance/arrival with **pause/resume** and a red ✕ **end trip**. Arrival
  ends guidance automatically.
- **2D / 3D camera** — 3D: tilted chase camera with Google's photoreal-adjacent vector
  buildings; 2D: top-down track-up with a navigation puck (dark disc + white arrow)
  replacing the car sprite. Zoom via on-screen buttons or scroll wheel; the chase
  look-ahead scales with zoom so the vehicle never leaves the screen.
- **Light & dark themes** — one toggle switches the UI tokens *and* the map's color scheme
  (Google `LIGHT`/`DARK`, or OpenFreeMap positron/dark on the fallback).
- **Settings side panel** — slides in from the right (≡ button top-right): target speed,
  2D/3D camera, theme. Speed, view mode and theme persist in localStorage.
- **Vehicle chrome** — brand top bar (battery, clock, outside temp), app launcher with
  working cabin-temperature steppers, live speed chip.

## Architecture

```
src/
├── data/            # Static/mock data: default position, offline destinations,
│                    # launcher apps, (dormant) ad campaign definitions
├── services/
│   ├── location/    # Browser geolocation helper
│   ├── map/         # MapAdapter abstraction + Google/MapLibre implementations,
│   │                # provider selection, DOM marker elements
│   ├── places/      # Google Places autocomplete client
│   └── routing/     # OSRM client (routes + turn-by-turn steps), maneuver scheduling
├── store/           # Zustand stores: simulation, navigation, settings, vehicle,
│                    # boot, toast, (dormant) campaigns
├── shared/
│   ├── lib/         # Pure logic: geo math, route indexing, formatting, easing
│   ├── hooks/       # useViewportSize
│   └── components/  # Toast
└── features/
    ├── cockpit/     # Photo backdrop + alignment math
    ├── headUnit/    # Screen frame, top bar, launcher, climate controls
    ├── map/         # Map lifecycle, boot overlay, route line, destination flag, zoom
    ├── navigation/  # Search, directions panel, preview card, turn banner, ETA bar,
    │                # route planner + place-suggestion hooks
    ├── offers/      # (dormant) geofencing engine for upcoming ad formats
    ├── settings/    # Side panel, ≡ button, theme application
    └── simulation/  # DriveSimulator engine, per-frame controller, speed chip
```

### Map provider abstraction

Everything map-related goes through the `MapAdapter` interface
(`services/map/MapAdapter.ts`): per-frame vehicle/camera updates, the guidance polyline,
journey-overview framing, follow transitions, destination flag, theming, and (dormant)
campaign regions. Two implementations:

- **`GoogleMapsAdapter`** — used when an API key is configured. One vector map
  (`renderingType: VECTOR`, required for tilt/heading) serves both camera modes. The map
  is recreated on theme change because Google fixes `colorScheme` at construction.
- **`MaplibreMapAdapter`** — automatic fallback (OpenFreeMap vector style → raster OSM
  tiles → error), including 3D building extrusion and theme-aware styles.

Failures cascade: Google auth failure → MapLibre; vector style failure → raster tiles;
OSRM failure → straight-line route. Each step surfaces a notice instead of breaking.

### Simulation engine

- **`RouteIndex`** — a polyline indexed by cumulative distance for O(log n) position
  lookups; also anchors turn-by-turn maneuvers to distances along the route.
- **`DriveSimulator`** — advances the vehicle by elapsed time × target speed; loop or
  one-way with arrival detection. Framework-agnostic, fully unit-tested.
- **`SimulationController`** — a headless component running one `requestAnimationFrame`
  loop. It reads control state via `store.getState()` (no React subscriptions), drives the
  adapter imperatively, and only writes to stores when a derived value actually changes
  (remaining distance rounded to 10 m, next maneuver) — so React re-renders stay minimal
  at 60 fps.

### Camera behavior (smoothness & anti-flicker)

- The chase camera looks ahead of the car along the **smoothed** bearing (raw route
  bearings jump at polyline vertices and would lurch the view sideways).
- Bearing is exponentially smoothed per frame; the look-ahead distance halves per zoom
  step so the car keeps a constant screen position at any zoom.
- Camera updates are **skipped when nothing changed beyond numeric noise** — redundant
  per-frame `moveCamera` calls make the basemap re-run icon-collision passes, which reads
  as marker/label flicker while paused.
- Start-of-navigation runs a 1.4 s eased interpolation from the overview back into the
  chase view (center/zoom/tilt/heading simultaneously).
- Our markers use explicit `zIndex` + `collisionBehavior: REQUIRED` so Google's collision
  pass can never fade them.

### Navigation state machine

`navigationStore` drives the UX phases: `idle` (search visible) → `preview` (directions
panel + overview + preview card) → `navigating` (turn banner + ETA bar) → back to `idle`
on arrival, cancel or end-trip. Origin/destination live only in memory — the starting
point is resolved fresh per route: vehicle position → live geolocation → default.

### Styling

Tailwind CSS v4 (via `@tailwindcss/vite`), utility classes directly in JSX — no CSS
modules. Design tokens are plain CSS variables in `src/styles/global.css`, themed via
`data-theme="dark"` on the document root and mapped to Tailwind utilities with
`@theme inline` (`bg-surface`, `text-muted`, `border-line`, `text-nav-green`, …). Even the
imperative DOM markers (car, puck, flag) use Tailwind classes, including
`group-data-[mode=2d]:` variants for the 2D/3D marker switch and a custom `animate-halo`
keyframe.

### Ads / campaign engine (dormant)

The previous demo ad layer (geofenced campaign regions, branded pins, offer cards) has
been removed from the UI, but the engine is kept and tested for the upcoming ad formats:
campaign definitions (`data/campaigns.ts`), region anchoring along a route
(`features/offers/campaignRegions.ts`), enter/exit geofencing
(`features/offers/geofencing.ts`), a campaign store, and `MapAdapter.setCampaignRegions`
(circle + branded pin per region) in both adapters. Wiring it back is: build regions →
`campaignStore.initRegions` → evaluate the `GeofenceTracker` in the simulation loop.

## Testing

- **Unit tests (Vitest, 33)** colocated with their modules: geo math, route indexing,
  drive simulation, endpoint pinning, maneuver mapping/scheduling, geofencing, formatting
  (durations, distances, clock), backdrop layout math, and the navigation state machine.
  Run `npm run test:run`.
- **Visual verification** — `playwright` is a devDependency; the app has been verified
  headlessly across themes, phases and viewports (launch Chromium with
  `--enable-gpu --use-angle=metal` on macOS, otherwise Google falls back to raster and
  tilt/heading are ignored).

## Extending

- **New ad formats** — reuse the dormant campaign engine (see above); adapters already
  render circles + custom-branded pins.
- **New map provider** — implement `MapAdapter` and add a case to `MapView`.
- **New settings** — add state to `settingsStore` (persist via `partialize`) and a row in
  `SettingsPanel`.
- **Offline destinations** — extend `data/destinations.ts` (used only without an API key).
- **Real vehicle data** — write gear/battery/temperatures into `vehicleStore`; the top bar
  and climate controls are already subscribed.
