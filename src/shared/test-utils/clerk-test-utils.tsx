import type { ReactNode } from 'react'
import { render as rtlRender } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { mockUseAuth, mockUseUser, mockUseClerk, mockGetToken } from './setup'

// Mock Clerk types
export interface MockUser {
  id: string
  firstName?: string
  lastName?: string
  fullName?: string
  emailAddresses?: Array<{
    emailAddress: string
    id: string
  }>
  primaryEmailAddress?: {
    emailAddress: string
  }
  imageUrl?: string
  publicMetadata?: Record<string, any>
}

export interface MockAuth {
  userId: string | null
  sessionId: string | null
  isSignedIn: boolean
  isLoaded: boolean
}

// Create mock user with defaults
export const createMockUser = (overrides?: Partial<MockUser>): MockUser => ({
  id: 'user_test123',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  emailAddresses: [{
    emailAddress: 'test@example.com',
    id: 'email_1'
  }],
  primaryEmailAddress: {
    emailAddress: 'test@example.com'
  },
  imageUrl: 'https://example.com/avatar.jpg',
  publicMetadata: {},
  ...overrides,
})

// Mock ClerkProvider for testing
export const MockClerkProvider = ({ children }: { 
  children: ReactNode,
}) => {
  return <>{children}</>
}

// Custom render function with providers
interface RenderOptions {
  user?: MockUser | null
  isSignedIn?: boolean
  isLoaded?: boolean
  initialEntries?: string[]
}

export function renderWithClerk(
  ui: React.ReactElement,
  {
    user = null,
    isSignedIn = false,
    isLoaded = true,
    initialEntries = ['/'],
    ...renderOptions
  }: RenderOptions = {}
) {
  // Set the mock state for this render
  if (user && isSignedIn) {
    setUserState(user, true)
  } else {
    setAuthState({ isSignedIn, isLoaded })
  }
  
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <MockClerkProvider>
          {children}
        </MockClerkProvider>
      </MemoryRouter>
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

// Helper to set auth state in tests
export const setAuthState = (state: Partial<MockAuth>) => {
  mockUseAuth.mockReturnValue({
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    sessionId: null,
    getToken: mockGetToken,
    ...state,
  })
}

// Helper to set user state in tests
export const setUserState = (user: MockUser | null, isSignedIn = true) => {
  mockUseUser.mockReturnValue({
    isLoaded: true,
    isSignedIn,
    user,
  })
  
  if (isSignedIn && user) {
    setAuthState({
      isSignedIn: true,
      userId: user.id,
      sessionId: 'session_test123',
    })
  }
}