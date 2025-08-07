import { vi } from 'vitest'

// Mock for virtual:pwa-register/react
export const useRegisterSW = vi.fn(() => ({
  needRefresh: [false, vi.fn()],
  offlineReady: [false, vi.fn()],
  updateServiceWorker: vi.fn(),
}))