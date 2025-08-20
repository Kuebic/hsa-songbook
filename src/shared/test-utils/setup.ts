import '@testing-library/jest-dom'
import { beforeEach, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'
import 'fake-indexeddb/auto' // Add IndexedDB polyfill for tests

// Mock virtual:pwa-register/react module for PWA tests
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(() => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn().mockResolvedValue(undefined)
  }))
}))

// Create singleton mock instances outside of vi.mock to prevent recreation
const mockUseAuth = vi.fn()
const mockUseUser = vi.fn()
const mockUseClerk = vi.fn()
const mockGetToken = vi.fn()
const mockSignOut = vi.fn()
const mockOpenSignIn = vi.fn()
const mockOpenSignUp = vi.fn()

// Set default mock return values
mockUseAuth.mockReturnValue({
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  sessionId: null,
  getToken: mockGetToken,
})

mockUseUser.mockReturnValue({
  isLoaded: true,
  isSignedIn: false,
  user: null,
})

mockUseClerk.mockReturnValue({
  signOut: mockSignOut,
  openSignIn: mockOpenSignIn,
  openSignUp: mockOpenSignUp,
})

// Don't auto-mock the useAuth hook at module level - let individual tests decide

// Mock song mutations hook
const mockUseSongMutations = vi.fn()
mockUseSongMutations.mockReturnValue({
  createSong: vi.fn(),
  updateSong: vi.fn(),
  updateSongTitle: vi.fn(),
  updateSongField: vi.fn(),
  deleteSong: vi.fn(),
  rateSong: vi.fn(),
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isRating: false,
  error: null,
  optimisticSongs: [],
  clearError: vi.fn(),
  isAuthenticated: false
})

// Don't auto-mock useSongMutations - let individual tests decide  
// vi.mock('@features/songs/hooks/mutations/useSongMutations', () => ({
//   useSongMutations: mockUseSongMutations
// }))

// Mock other commonly used hooks
const mockUseOnlineStatus = vi.fn()
mockUseOnlineStatus.mockReturnValue({
  isOnline: true,
  wasOffline: false
})

// Don't auto-mock useOnlineStatus - let individual tests decide
// vi.mock('@features/pwa/hooks/useOnlineStatus', () => ({
//   useOnlineStatus: mockUseOnlineStatus
// }))

const mockUseServiceWorker = vi.fn()
mockUseServiceWorker.mockReturnValue({
  offlineReady: false,
  needRefresh: false,
  updateServiceWorker: vi.fn(),
  close: vi.fn()
})

// Don't auto-mock useServiceWorker - let individual tests decide
// vi.mock('@features/pwa/hooks/useServiceWorker', () => ({
//   useServiceWorker: mockUseServiceWorker
// }))

const mockUseModal = vi.fn()
mockUseModal.mockReturnValue({
  openModals: [],
  registerModal: vi.fn(),
  unregisterModal: vi.fn(),
  isTopModal: vi.fn(() => false)
})

// Don't auto-mock ModalProvider - let individual tests decide
// vi.mock('@shared/components/modal/ModalProvider', () => ({
//   useModal: mockUseModal,
//   ModalProvider: ({ children }: { children: React.ReactNode }) => children
// }))

const mockUseInlineEdit = vi.fn()
mockUseInlineEdit.mockReturnValue({
  value: '',
  isEditing: false,
  error: null,
  startEdit: vi.fn(),
  save: vi.fn(),
  cancel: vi.fn(),
  setValue: vi.fn()
})

// Don't auto-mock useInlineEdit - let individual tests decide
// vi.mock('@features/songs/hooks/useInlineEdit', () => ({
//   useInlineEdit: mockUseInlineEdit
// }))

const mockUseDragAndDropEnhanced = vi.fn()
mockUseDragAndDropEnhanced.mockReturnValue({
  items: [],
  handleDragStart: vi.fn(),
  handleDragEnd: vi.fn(),
  disabled: false
})

// Don't auto-mock useDragAndDropEnhanced - let individual tests decide
// vi.mock('@features/setlists/hooks/useDragAndDropEnhanced', () => ({
//   useDragAndDropEnhanced: mockUseDragAndDropEnhanced
// }))

const mockUseAutoSave = vi.fn()
mockUseAutoSave.mockReturnValue({
  isAutoSaving: false,
  lastSaved: null,
  forceAutoSave: vi.fn(),
  clearDrafts: vi.fn()
})

// Don't auto-mock useAutoSave - let individual tests decide
// vi.mock('@features/arrangements/hooks/useAutoSave', () => ({
//   useAutoSave: mockUseAutoSave
// }))

const mockUseExitSave = vi.fn()
mockUseExitSave.mockReturnValue({
  isSaving: false,
  error: null,
  clearError: vi.fn()
})

// Don't auto-mock useExitSave - let individual tests decide
// vi.mock('@features/arrangements/hooks/useExitSave', () => ({
//   useExitSave: mockUseExitSave
// }))

// Mock Clerk with factory function to ensure consistent instances
interface MockComponentProps {
  children?: React.ReactNode
  [key: string]: unknown
}

vi.mock('@clerk/clerk-react', () => ({
  ClerkProvider: ({ children }: MockComponentProps) => children,
  useAuth: mockUseAuth,
  useUser: mockUseUser,
  useClerk: mockUseClerk,
  SignedIn: ({ children }: MockComponentProps) => {
    const auth = mockUseAuth()
    return auth.isSignedIn ? children : null
  },
  SignedOut: ({ children }: MockComponentProps) => {
    const auth = mockUseAuth()
    return !auth.isSignedIn ? children : null
  },
  SignInButton: ({ children, ...props }: MockComponentProps) => {
    // Filter out Clerk-specific props that shouldn't be passed to DOM elements
    const { 
      mode: _mode, 
      redirectUrl: _redirectUrl, 
      signUpUrl: _signUpUrl, 
      forceRedirectUrl: _forceRedirectUrl,
      fallbackRedirectUrl: _fallbackRedirectUrl,
      ...domProps 
    } = props || {}
    
    if (children) {
      return React.createElement('div', domProps, children)
    }
    return React.createElement('button', { 
      'data-testid': 'sign-in-button',
      ...domProps 
    }, 'Sign In')
  },
  SignUpButton: ({ children, ...props }: MockComponentProps) => {
    // Filter out Clerk-specific props that shouldn't be passed to DOM elements
    const { 
      mode: _mode, 
      redirectUrl: _redirectUrl, 
      signInUrl: _signInUrl, 
      forceRedirectUrl: _forceRedirectUrl,
      fallbackRedirectUrl: _fallbackRedirectUrl,
      ...domProps 
    } = props || {}
    
    if (children) {
      return React.createElement('div', domProps, children)
    }
    return React.createElement('button', { 
      'data-testid': 'sign-up-button',
      ...domProps 
    }, 'Sign Up')
  },
  UserButton: (props: MockComponentProps) => {
    // Filter out Clerk-specific props that shouldn't be passed to DOM elements
    const { 
      afterSignOutUrl: _afterSignOutUrl, 
      appearance: _appearance, 
      showName: _showName,
      signInUrl: _signInUrl,
      userProfileUrl: _userProfileUrl,
      userProfileMode: _userProfileMode,
      defaultOpen: _defaultOpen,
      ...domProps 
    } = props || {}
    
    return React.createElement('button', { 
      'data-testid': 'user-button',
      'data-after-sign-out-url': _afterSignOutUrl, // Store as data attribute for testing if needed
      ...domProps 
    }, 'User')
  },
}))

// Mock EditorStorageService
const mockEditorStorageService = {
  initialize: vi.fn().mockResolvedValue(undefined),
  saveDraftToSession: vi.fn().mockResolvedValue(undefined),
  saveLargeDraftToIndexedDB: vi.fn().mockResolvedValue(undefined),
  loadDraftFromSession: vi.fn().mockResolvedValue(null),
  loadDraftFromIndexedDB: vi.fn().mockResolvedValue(null),
  clearDraft: vi.fn().mockResolvedValue(undefined),
  clearAllDrafts: vi.fn().mockResolvedValue(undefined),
  getStorageStats: vi.fn().mockResolvedValue({
    sessionStorageUsed: 1000,
    sessionStorageTotal: 5000000,
    indexedDBUsed: 0,
    indexedDBQuota: 100000000
  }),
  cleanup: vi.fn().mockResolvedValue(undefined)
}

// Mock the entire EditorStorageService class
vi.mock('@features/arrangements/services/EditorStorageService', () => ({
  EditorStorageService: vi.fn().mockImplementation(() => mockEditorStorageService)
}))

// Mock arrangementService
const mockArrangementService = {
  updateArrangement: vi.fn().mockResolvedValue({ success: true }),
  createArrangement: vi.fn().mockResolvedValue({ id: 'test-arrangement', success: true }),
  deleteArrangement: vi.fn().mockResolvedValue({ success: true }),
  getArrangement: vi.fn().mockResolvedValue(null),
  getArrangements: vi.fn().mockResolvedValue([]),
}

vi.mock('@features/songs/services/arrangementService', () => ({
  arrangementService: mockArrangementService
}))

// Mock useAuth hook globally to prevent individual tests from needing to mock it
vi.mock('@features/auth/hooks/useAuth', () => ({
  useAuth: mockUseAuth
}))

// Export mock instances for use in tests
export { 
  mockUseAuth, 
  mockUseUser, 
  mockUseClerk, 
  mockGetToken, 
  mockSignOut, 
  mockOpenSignIn, 
  mockOpenSignUp,
  mockUseSongMutations,
  mockUseOnlineStatus,
  mockUseServiceWorker,
  mockUseModal,
  mockUseInlineEdit,
  mockUseDragAndDropEnhanced,
  mockUseAutoSave,
  mockUseExitSave,
  mockEditorStorageService,
  mockArrangementService,
  sessionStorageMock
}

// Mock localStorage with proper cleanup
const localStorageStore: Record<string, string> = {}

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key]
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach(key => delete localStorageStore[key])
  }),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock sessionStorage with proper cleanup
const sessionStorageStore: Record<string, string> = {}

const sessionStorageMock = {
  getItem: vi.fn((key: string) => sessionStorageStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStorageStore[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete sessionStorageStore[key]
  }),
  clear: vi.fn(() => {
    Object.keys(sessionStorageStore).forEach(key => delete sessionStorageStore[key])
  }),
  length: 0,
  key: vi.fn(() => null)
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
})

// Mock window.matchMedia
const matchMediaMock = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  value: matchMediaMock,
  writable: true,
})

// Mock IntersectionObserver
const IntersectionObserverMock = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver

// Mock navigator.sendBeacon for exit save tests
Object.defineProperty(navigator, 'sendBeacon', {
  value: vi.fn().mockReturnValue(true),
  writable: true,
  configurable: true
})

// Mock fetch for API calls with proper base URL
const mockFetch = vi.fn().mockImplementation((url: string | URL | Request, options?: RequestInit) => {
  let actualUrl = url
  
  // Handle relative URLs by adding a base URL
  if (typeof url === 'string' && url.startsWith('/api')) {
    actualUrl = `http://localhost:3000${url}`
  }
  
  // Return a default successful response for API calls
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    json: () => Promise.resolve({
      success: true,
      data: [],
      songs: [],
      message: 'Mock response'
    }),
    text: () => Promise.resolve('Mock response'),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    clone: function() { return this },
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic' as ResponseType,
    url: typeof actualUrl === 'string' ? actualUrl : actualUrl.toString()
  } as Response)
})

// Replace global fetch with our mock
global.fetch = mockFetch

// Mock Web Crypto API for tests that need it
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => Math.random().toString(36).substring(2) + Date.now().toString(36),
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256)
        }
        return arr
      }
    },
    writable: true
  })
}

// Mock navigator.onLine with proper configurable property for tests
if (!Object.getOwnPropertyDescriptor(navigator, 'onLine')) {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    configurable: true,
    value: true
  })
}

// Export mock fetch for use in tests
export { mockFetch }

// Reset mocks before each test
beforeEach(() => {
  // Reset mock function calls but keep implementations
  mockUseAuth.mockClear()
  mockUseUser.mockClear()
  mockUseClerk.mockClear()
  mockGetToken.mockClear()
  mockSignOut.mockClear()
  mockOpenSignIn.mockClear()
  mockOpenSignUp.mockClear()
  mockUseSongMutations.mockClear()
  mockUseOnlineStatus.mockClear()
  mockUseServiceWorker.mockClear()
  mockUseModal.mockClear()
  mockUseInlineEdit.mockClear()
  mockUseDragAndDropEnhanced.mockClear()
  mockUseAutoSave.mockClear()
  mockUseExitSave.mockClear()
  
  // Reset to default return values
  mockUseAuth.mockReturnValue({
    user: null,
    userId: null,
    sessionId: null,
    isLoaded: true,
    isSignedIn: false,
    isAdmin: false,
    getToken: mockGetToken,
    getUserEmail: vi.fn(),
    getUserName: vi.fn(),
    getUserAvatar: vi.fn()
  })
  
  mockUseUser.mockReturnValue({
    isLoaded: true,
    isSignedIn: false,
    user: null,
  })
  
  mockUseClerk.mockReturnValue({
    signOut: mockSignOut,
    openSignIn: mockOpenSignIn,
    openSignUp: mockOpenSignUp,
  })
  
  // Reset other hook mocks
  mockUseSongMutations.mockReturnValue({
    createSong: vi.fn(),
    updateSong: vi.fn(),
    updateSongTitle: vi.fn(),
    updateSongField: vi.fn(),
    deleteSong: vi.fn(),
    rateSong: vi.fn(),
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isRating: false,
    error: null,
    optimisticSongs: [],
    clearError: vi.fn(),
    isAuthenticated: false
  })
  
  mockUseOnlineStatus.mockReturnValue({
    isOnline: true,
    wasOffline: false
  })
  
  mockUseServiceWorker.mockReturnValue({
    offlineReady: false,
    needRefresh: false,
    updateServiceWorker: vi.fn(),
    close: vi.fn()
  })
  
  mockUseModal.mockReturnValue({
    openModals: [],
    registerModal: vi.fn(),
    unregisterModal: vi.fn(),
    isTopModal: vi.fn(() => false)
  })
  
  mockUseInlineEdit.mockReturnValue({
    value: '',
    isEditing: false,
    error: null,
    startEdit: vi.fn(),
    save: vi.fn(),
    cancel: vi.fn(),
    setValue: vi.fn()
  })
  
  mockUseDragAndDropEnhanced.mockReturnValue({
    items: [],
    handleDragStart: vi.fn(),
    handleDragEnd: vi.fn(),
    disabled: false
  })
  
  mockUseAutoSave.mockReturnValue({
    isAutoSaving: false,
    lastSaved: null,
    forceAutoSave: vi.fn(),
    clearDrafts: vi.fn()
  })
  
  mockUseExitSave.mockReturnValue({
    isSaving: false,
    error: null,
    clearError: vi.fn()
  })
  
  // Clear localStorage
  localStorageMock.clear()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
  
  // Clear sessionStorage
  sessionStorageMock.clear()
  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()
  
  // Reset service mocks
  mockEditorStorageService.initialize.mockClear()
  mockEditorStorageService.saveDraftToSession.mockClear()
  mockEditorStorageService.loadDraftFromSession.mockClear()
  mockEditorStorageService.clearDraft.mockClear()
  mockEditorStorageService.clearAllDrafts.mockClear()
  
  mockArrangementService.updateArrangement.mockClear()
  mockArrangementService.createArrangement.mockClear()
  mockArrangementService.deleteArrangement.mockClear()
  mockArrangementService.getArrangement.mockClear()
  mockArrangementService.getArrangements.mockClear()
  
  // Reset fetch mock
  mockFetch.mockClear()
})

// Clean up after each test
afterEach(() => {
  // Clean up React Testing Library
  cleanup()
  
  // Clear all timers
  vi.clearAllTimers()
  
  // Clear all mocks
  vi.clearAllMocks()
  
  // Clear jsdom
  document.body.innerHTML = ''
  document.head.innerHTML = ''
})