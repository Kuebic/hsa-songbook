import '@testing-library/jest-dom'
import { beforeEach, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'

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
    if (children) {
      return React.createElement('div', props, children)
    }
    return React.createElement('button', props, 'Sign In')
  },
  SignUpButton: ({ children, ...props }: MockComponentProps) => {
    if (children) {
      return React.createElement('div', props, children)
    }
    return React.createElement('button', props, 'Sign Up')
  },
  UserButton: (props: MockComponentProps) => {
    const restProps = props || {}
    return React.createElement('button', { 'data-testid': 'user-button', ...restProps }, 'User')
  },
}))

// Export mock instances for use in tests
export { mockUseAuth, mockUseUser, mockUseClerk, mockGetToken, mockSignOut, mockOpenSignIn, mockOpenSignUp }

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
  
  // Reset to default return values
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
  
  // Clear localStorage
  localStorageMock.clear()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
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