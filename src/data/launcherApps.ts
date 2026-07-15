export interface LauncherApp {
  id: string
  icon: string
  label: string
  /** Accent key mapped to a colour in the launcher styles. */
  accent?: 'phone' | 'music' | 'calendar'
  /** Action dispatched when the app is tapped; wired up in the Launcher. */
  action?: 'openSettings'
}

export const LAUNCHER_APPS: LauncherApp[] = [
  { id: 'phone', icon: '📞', label: 'Phone', accent: 'phone' },
  { id: 'navigation', icon: '🧭', label: 'Navigation' },
  { id: 'music', icon: '♫', label: 'Music', accent: 'music' },
  { id: 'calendar', icon: '▦', label: 'Calendar', accent: 'calendar' },
  { id: 'climate', icon: '◐', label: 'Climate' }
  // { id: 'settings', icon: '⚙', label: 'Settings', action: 'openSettings' }
]
