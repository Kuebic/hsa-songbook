import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Layout } from '../Layout'

// Mock the auth hook
vi.mock('@features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

// Mock the responsive hooks
vi.mock('@features/responsive/hooks/useViewport', () => ({
  useViewport: () => ({ isMobile: false })
}))

vi.mock('@features/responsive/hooks/useResponsiveNav', () => ({
  useResponsiveNav: () => ({ isMenuOpen: false, toggleMenu: vi.fn(), closeMenu: vi.fn() })
}))

// Import the mocked function
import { useAuth } from '@features/auth/hooks/useAuth'

describe('Layout - Moderation Link Visibility', () => {
  it('should show Moderation link for moderators', () => {
    // Mock moderator user
    vi.mocked(useAuth).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      isAdmin: false,
      isModerator: true,
      user: { id: 'mod-user', email: 'mod@test.com' },
      userId: 'mod-user',
      sessionId: 'session-123',
      getToken: vi.fn(),
      userRole: 'moderator',
      permissions: { canModerate: true, canAdmin: false },
      customRoles: [],
      permissionGroups: [],
      getUserEmail: () => 'mod@test.com',
      getUserName: () => 'Moderator User',
      getUserAvatar: () => undefined,
      session: null,
      signInWithProvider: vi.fn(),
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      resetPassword: vi.fn(),
      signOut: vi.fn()
    } as any)

    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    )

    // Check that Moderation link is visible
    expect(screen.getByRole('link', { name: /moderation/i })).toBeInTheDocument()
    
    // Check that Admin link is NOT visible
    expect(screen.queryByRole('link', { name: /^admin$/i })).not.toBeInTheDocument()
  })

  it('should show both Moderation and Admin links for admins', () => {
    // Mock admin user
    vi.mocked(useAuth).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      isAdmin: true,
      isModerator: false, // Admins might not have isModerator=true but should still see moderation
      user: { id: 'admin-user', email: 'admin@test.com' },
      userId: 'admin-user',
      sessionId: 'session-456',
      getToken: vi.fn(),
      userRole: 'admin',
      permissions: { canModerate: true, canAdmin: true },
      customRoles: [],
      permissionGroups: [],
      getUserEmail: () => 'admin@test.com',
      getUserName: () => 'Admin User',
      getUserAvatar: () => undefined,
      session: null,
      signInWithProvider: vi.fn(),
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      resetPassword: vi.fn(),
      signOut: vi.fn()
    } as any)

    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    )

    // Check that both links are visible
    expect(screen.getByRole('link', { name: /moderation/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument()
  })

  it('should not show Moderation link for regular users', () => {
    // Mock regular user
    vi.mocked(useAuth).mockReturnValue({
      isSignedIn: true,
      isLoaded: true,
      isAdmin: false,
      isModerator: false,
      user: { id: 'regular-user', email: 'user@test.com' },
      userId: 'regular-user',
      sessionId: 'session-789',
      getToken: vi.fn(),
      userRole: 'user',
      permissions: { canModerate: false, canAdmin: false },
      customRoles: [],
      permissionGroups: [],
      getUserEmail: () => 'user@test.com',
      getUserName: () => 'Regular User',
      getUserAvatar: () => undefined,
      session: null,
      signInWithProvider: vi.fn(),
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      resetPassword: vi.fn(),
      signOut: vi.fn()
    } as any)

    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    )

    // Check that neither Moderation nor Admin links are visible
    expect(screen.queryByRole('link', { name: /moderation/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument()
  })

  it('should not show Moderation link for unauthenticated users', () => {
    // Mock unauthenticated user
    vi.mocked(useAuth).mockReturnValue({
      isSignedIn: false,
      isLoaded: true,
      isAdmin: false,
      isModerator: false,
      user: null,
      userId: undefined,
      sessionId: undefined,
      getToken: vi.fn(),
      userRole: 'user',
      permissions: { canModerate: false, canAdmin: false },
      customRoles: [],
      permissionGroups: [],
      getUserEmail: () => undefined,
      getUserName: () => 'User',
      getUserAvatar: () => undefined,
      session: null,
      signInWithProvider: vi.fn(),
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      resetPassword: vi.fn(),
      signOut: vi.fn()
    } as any)

    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    )

    // Check that neither Moderation nor Admin links are visible
    expect(screen.queryByRole('link', { name: /moderation/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument()
  })
})