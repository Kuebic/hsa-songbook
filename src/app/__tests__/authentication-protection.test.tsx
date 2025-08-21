import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@features/auth'
import { useAuth } from '@features/auth/hooks/useAuth'

// Mock the useAuth hook
vi.mock('@features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

describe('Authentication Protection for Chord Editor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state while auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: false,
      isSignedIn: false,
      isAdmin: false,
      userId: null,
      getToken: vi.fn(),
      signOut: vi.fn()
    })

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
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      isAdmin: false,
      userId: null,
      getToken: vi.fn(),
      signOut: vi.fn()
    })

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
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      userId: 'user-123',
      getToken: vi.fn().mockResolvedValue('mock-token'),
      signOut: vi.fn()
    })

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
    vi.mocked(useAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      isAdmin: false,
      userId: null,
      getToken: vi.fn(),
      signOut: vi.fn()
    })

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