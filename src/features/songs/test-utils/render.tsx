import { ReactElement } from 'react'
import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { NotificationProvider } from '@shared/components/notifications'
import { vi } from 'vitest'

// Set up auth mock at module level
const mockUseAuth = vi.fn()
vi.mock('@features/auth/hooks/useAuth', () => ({
  useAuth: mockUseAuth
}))

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: { 
    id: string
    role?: 'USER' | 'ADMIN'
    email?: string
    name?: string
  }
  initialRoute?: string
  isSignedIn?: boolean
  isAdmin?: boolean
}

/**
 * Custom render function for song feature tests
 * Provides all necessary context providers and mocks
 */
export function render(
  ui: ReactElement,
  {
    user = null,
    initialRoute = '/',
    isSignedIn = false,
    isAdmin = false,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Configure mock auth based on provided options
  if (user || isSignedIn) {
    const mockUser = user || {
      id: 'test-user',
      role: isAdmin ? 'ADMIN' : 'USER',
      email: 'test@example.com',
      name: 'Test User'
    }
    
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      isAdmin: mockUser.role === 'ADMIN' || isAdmin,
      user: mockUser,
      userId: mockUser.id,
      sessionId: 'test-session',
      isLoaded: true,
      getToken: () => Promise.resolve('test-token'),
      getUserEmail: () => mockUser.email,
      getUserName: () => mockUser.name,
      getUserAvatar: () => null
    })
  } else {
    mockUseAuth.mockReturnValue({
      isSignedIn: false,
      isAdmin: false,
      user: null,
      userId: null,
      sessionId: null,
      isLoaded: true,
      getToken: () => Promise.resolve(null),
      getUserEmail: () => null,
      getUserName: () => 'Guest',
      getUserAvatar: () => null
    })
  }
  
  // Set initial route if provided
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute)
  }
  
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </BrowserRouter>
    )
  }
  
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Render with admin user context
 */
export function renderAsAdmin(ui: ReactElement, options?: Omit<CustomRenderOptions, 'isAdmin'>) {
  return render(ui, {
    ...options,
    isAdmin: true,
    isSignedIn: true,
    user: {
      id: 'admin-user',
      role: 'ADMIN',
      email: 'admin@example.com',
      name: 'Admin User',
      ...options?.user
    }
  })
}

/**
 * Render with regular user context
 */
export function renderAsUser(ui: ReactElement, options?: Omit<CustomRenderOptions, 'isAdmin'>) {
  return render(ui, {
    ...options,
    isAdmin: false,
    isSignedIn: true,
    user: {
      id: 'regular-user',
      role: 'USER',
      email: 'user@example.com',
      name: 'Regular User',
      ...options?.user
    }
  })
}

/**
 * Render as unauthenticated user
 */
export function renderAsGuest(ui: ReactElement, options?: Omit<CustomRenderOptions, 'isSignedIn' | 'user'>) {
  return render(ui, {
    ...options,
    isSignedIn: false,
    user: null
  })
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'

// Export custom render functions as default
export default {
  render,
  renderAsAdmin,
  renderAsUser,
  renderAsGuest
}