import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@features/auth'
import { useAuth } from '@features/auth/hooks/useAuth'
import type { User } from '@features/auth/types'

// Mock the useAuth hook
vi.mock('@features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

// Helper to create complete auth mock
const createAuthMock = (overrides: Partial<ReturnType<typeof useAuth>> = {}) => ({
  user: null,
  userId: undefined,
  sessionId: undefined,
  isLoaded: false,
  isSignedIn: false,
  isAdmin: false,
  isAnonymous: false,
  getToken: vi.fn().mockResolvedValue(null),
  getUserEmail: vi.fn().mockReturnValue(undefined),
  getUserName: vi.fn().mockReturnValue('User'),
  getUserAvatar: vi.fn().mockReturnValue(undefined),
  session: null,
  signInWithProvider: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  resetPassword: vi.fn(),
  signInAnonymously: vi.fn(),
  linkEmailToAnonymousUser: vi.fn(),
  linkOAuthToAnonymousUser: vi.fn(),
  signOut: vi.fn(),
  ...overrides
})

describe('Authentication Protection for Chord Editor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state while auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue(createAuthMock({
      isLoaded: false
    }))

    render(
      <MemoryRouter initialEntries={['/test']}>
        <Routes>
          <Route 
            path="/test" 
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect to home when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue(createAuthMock({
      isLoaded: true
    }))

    render(
      <MemoryRouter initialEntries={['/arrangements/new']}>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route 
            path="/arrangements/new" 
            element={
              <ProtectedRoute>
                <div>Chord Editor</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Home Page')).toBeInTheDocument()
    expect(screen.queryByText('Chord Editor')).not.toBeInTheDocument()
  })

  it('should show protected content when user is authenticated', () => {
    vi.mocked(useAuth).mockReturnValue(createAuthMock({
      isLoaded: true,
      isSignedIn: true,
      userId: 'user-123',
      user: { 
        id: 'user-123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '',
        updated_at: ''
      } as User,
      getToken: vi.fn().mockResolvedValue('mock-token')
    }))

    render(
      <MemoryRouter initialEntries={['/arrangements/new']}>
        <Routes>
          <Route 
            path="/arrangements/new" 
            element={
              <ProtectedRoute>
                <div>Chord Editor</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Chord Editor')).toBeInTheDocument()
  })

  it('should redirect from edit route when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue(createAuthMock({
      isLoaded: true
    }))

    render(
      <MemoryRouter initialEntries={['/arrangements/test-song/edit']}>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route 
            path="/arrangements/:slug/edit" 
            element={
              <ProtectedRoute>
                <div>Edit Chord Sheet</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Home Page')).toBeInTheDocument()
    expect(screen.queryByText('Edit Chord Sheet')).not.toBeInTheDocument()
  })
})