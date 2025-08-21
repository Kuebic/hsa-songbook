export interface NavigationState {
  fromSong?: string
  fromSearch?: boolean
  fromSetlist?: string
  timestamp?: number
  scrollPosition?: number
}

export interface UseNativeBackNavigationOptions {
  enabled?: boolean
  fallbackPath?: string
  arrangement?: {
    id: string
    songSlug?: string
  }
  onNavigate?: () => void
}

export interface UseNativeBackNavigationReturn {
  isEnabled: boolean
  navigationState: NavigationState
  handleBack: () => void
}