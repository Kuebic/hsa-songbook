import { vi } from 'vitest'

// Mock virtual:pwa-register/react module globally for all PWA tests
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn().mockResolvedValue(undefined)
  }))
}))