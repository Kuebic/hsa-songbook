export interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null
  updateAvailable: boolean
  offlineReady: boolean
  error: Error | null
}

export interface InstallPromptState {
  prompt: BeforeInstallPromptEvent | null
  isInstallable: boolean
  isInstalled: boolean
  platform: 'ios' | 'android' | 'desktop' | null
}

export interface CacheStrategy {
  cacheName: string
  handler: 'CacheFirst' | 'NetworkFirst' | 'StaleWhileRevalidate'
  expiration?: {
    maxEntries: number
    maxAgeSeconds: number
  }
}

export interface OfflineStatus {
  isOnline: boolean
  lastOnline: Date | null
  pendingRequests: number
}

// Extended Window interface for PWA events
declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent
  }
  
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent
  }
}

// BeforeInstallPromptEvent interface
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

// PWA Update Options
export interface UpdateOptions {
  onNeedRefresh?: () => void
  onOfflineReady?: () => void
  onRegistered?: (registration: ServiceWorkerRegistration) => void
  onRegisterError?: (error: Error) => void
}

// PWA Configuration
export interface PWAConfig {
  autoUpdate: boolean
  showInstallPrompt: boolean
  showUpdatePrompt: boolean
  offlineMode: boolean
}

// Sync Queue Item
export interface SyncQueueItem {
  id: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  timestamp: number
  retries: number
}