// PWA temporarily disabled - this is a stub implementation
// To re-enable: set ENABLE_PWA = true in vite.config.ts and uncomment the real implementation below

export interface ServiceWorkerHookReturn {
  offlineReady: boolean
  needRefresh: boolean
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  close: () => void
}

// Stub implementation when PWA is disabled
export function useServiceWorker(): ServiceWorkerHookReturn {
  return {
    offlineReady: false,
    needRefresh: false,
    updateServiceWorker: async () => {},
    close: () => {}
  }
}

/* Original implementation - uncomment when re-enabling PWA
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useCallback, useEffect } from 'react'

export function useServiceWorker(): ServiceWorkerHookReturn {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(registration) {
      // Check for updates every hour
      if (registration) {
        const checkInterval = 60 * 60 * 1000 // 1 hour
        setInterval(() => {
          registration.update()
        }, checkInterval)
        
        console.log('Service Worker registered:', registration)
      }
    },
    onRegisterError(error) {
      console.error('Service Worker registration failed:', error)
    }
  })

  // Log status changes
  useEffect(() => {
    if (offlineReady) {
      console.log('App ready to work offline')
    }
  }, [offlineReady])

  useEffect(() => {
    if (needRefresh) {
      console.log('New content available, refresh needed')
    }
  }, [needRefresh])

  const close = useCallback(() => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }, [setOfflineReady, setNeedRefresh])

  return {
    offlineReady,
    needRefresh,
    updateServiceWorker,
    close
  }
}
*/