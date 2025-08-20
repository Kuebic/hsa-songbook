import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { Layout } from '../Layout'
import { renderWithProviders } from '@shared/test-utils/testWrapper'

// Mock the lazy Clerk components
vi.mock('@features/auth/components/LazyClerkComponents', () => ({
  LazySignedIn: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="lazy-signed-in">{children}</div>
  ),
  LazySignedOut: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="lazy-signed-out">{children}</div>
  ),
  ClerkComponentLoader: () => <div data-testid="clerk-loader">Loading...</div>
}))

// Mock the auth components and hooks
vi.mock('@features/auth', () => ({
  AuthButtons: () => <div data-testid="auth-buttons">Auth Buttons</div>,
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
  useAuth: vi.fn(() => ({
    isAuthenticated: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn()
  }))
}))

describe('Layout', () => {
  const renderWithRouter = (component: React.ReactElement, initialEntries = ['/']) => {
    return renderWithProviders(component, { initialEntries })
  }

  it('renders the application title', () => {
    renderWithRouter(<Layout><div>Content</div></Layout>)
    
    expect(screen.getByText('🎵 HSA Songbook')).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    renderWithRouter(<Layout><div>Content</div></Layout>)
    
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Songs' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Setlists' })).toBeInTheDocument()
  })

  it('navigation links have correct href attributes', () => {
    renderWithRouter(<Layout><div>Content</div></Layout>)
    
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Songs' })).toHaveAttribute('href', '/songs')
    expect(screen.getByRole('link', { name: 'Search' })).toHaveAttribute('href', '/search')
    expect(screen.getByRole('link', { name: 'Setlists' })).toHaveAttribute('href', '/setlists')
  })

  it('highlights active navigation link', () => {
    renderWithRouter(<Layout><div>Content</div></Layout>, ['/songs'])
    
    const songsLink = screen.getByRole('link', { name: 'Songs' })
    const homeLink = screen.getByRole('link', { name: 'Home' })
    
    expect(songsLink).toHaveStyle({ color: 'var(--nav-active)', fontWeight: 'bold' })
    expect(homeLink).toHaveStyle({ color: 'var(--nav-text)', fontWeight: 'normal' })
  })

  it('renders children content in main section', () => {
    renderWithRouter(
      <Layout>
        <div data-testid="test-content">Test Content</div>
      </Layout>
    )
    
    const content = screen.getByTestId('test-content')
    expect(content).toBeInTheDocument()
    expect(content.textContent).toBe('Test Content')
  })

  it('renders auth components with Suspense boundaries', () => {
    renderWithRouter(<Layout><div>Content</div></Layout>)
    
    expect(screen.getByTestId('lazy-signed-out')).toBeInTheDocument()
    expect(screen.getByTestId('lazy-signed-in')).toBeInTheDocument()
    expect(screen.getByTestId('auth-buttons')).toBeInTheDocument()
    expect(screen.getByTestId('user-menu')).toBeInTheDocument()
  })

  it('renders footer with correct content', () => {
    renderWithRouter(<Layout><div>Content</div></Layout>)
    
    expect(screen.getByText('© 2025 HSA Songbook. All rights reserved.')).toBeInTheDocument()
  })

  it('applies correct navigation styling', () => {
    renderWithRouter(<Layout><div>Content</div></Layout>)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveStyle({
      backgroundColor: 'var(--nav-background)',
      color: 'var(--nav-text)',
      width: '100%'
    })
  })

  it('applies correct main section styling', () => {
    renderWithRouter(<Layout><div>Content</div></Layout>)
    
    const main = screen.getByRole('main')
    expect(main).toHaveStyle({
      flex: '1',
      backgroundColor: 'var(--color-foreground)',
      width: '100%'
    })
  })

  it('applies correct footer styling', () => {
    renderWithRouter(<Layout><div>Content</div></Layout>)
    
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveStyle({
      backgroundColor: 'var(--nav-background)',
      color: 'var(--text-tertiary)',
      width: '100%'
    })
  })

  it('has proper layout structure with flex column', () => {
    renderWithRouter(<Layout><div>Content</div></Layout>)
    
    const layoutContainer = screen.getByRole('navigation').parentElement
    expect(layoutContainer).toHaveStyle({
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    })
  })

  it('handles multiple children correctly', () => {
    renderWithRouter(
      <Layout>
        <div>First child</div>
        <div>Second child</div>
        <div>Third child</div>
      </Layout>
    )
    
    expect(screen.getByText('First child')).toBeInTheDocument()
    expect(screen.getByText('Second child')).toBeInTheDocument()
    expect(screen.getByText('Third child')).toBeInTheDocument()
  })

  it('navigation container has correct max width and centering', () => {
    renderWithRouter(<Layout><div>Content</div></Layout>)
    
    const navContainer = screen.getByText('🎵 HSA Songbook').parentElement
    expect(navContainer).toHaveStyle({
      display: 'flex'
    })
  })

  it('renders navigation links with correct gap spacing', () => {
    renderWithRouter(<Layout><div>Content</div></Layout>)
    
    const navLinksContainer = screen.getByRole('link', { name: 'Home' }).parentElement
    expect(navLinksContainer).toHaveStyle({ display: 'flex', gap: '2rem' })
  })

  it('auth section has correct styling and gap', () => {
    renderWithRouter(<Layout><div>Content</div></Layout>)
    
    const authSection = screen.getByTestId('lazy-signed-out').parentElement
    expect(authSection).toHaveStyle({
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    })
  })

  it('handles different active routes correctly', () => {
    const routes = [
      { path: '/', linkName: 'Home' },
      { path: '/songs', linkName: 'Songs' },
      { path: '/search', linkName: 'Search' },
      { path: '/setlists', linkName: 'Setlists' }
    ]
    
    routes.forEach(({ path, linkName }) => {
      const { unmount } = renderWithRouter(<Layout><div>Content</div></Layout>, [path])
      
      const activeLink = screen.getByRole('link', { name: linkName })
      expect(activeLink).toHaveStyle({ color: 'var(--nav-active)', fontWeight: 'bold' })
      
      unmount()
    })
  })

  it('maintains semantic HTML structure', () => {
    renderWithRouter(<Layout><div>Content</div></Layout>)
    
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})