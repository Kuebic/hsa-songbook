import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { NavLink } from 'react-router-dom'
import { LazySignedIn, LazySignedOut, ClerkComponentLoader } from '@features/auth/components/LazyClerkComponents'
import { AuthButtons, UserMenu } from '@features/auth'
import { ErrorBoundary } from '@features/monitoring'
import { AddSongButton } from '@features/songs/components/ui/AddSongButton'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ErrorBoundary level="section" isolate>
        <nav style={{
          backgroundColor: 'var(--color-card)',
          borderBottom: '1px solid var(--color-border)',
          color: 'var(--color-foreground)',
          width: '100%',
          transition: 'background-color 0.3s ease'
        }}>
          <div style={{ 
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
              <h1 style={{ fontSize: '1.5rem', margin: 0 }}>
                🎵 HSA Songbook
              </h1>
            
            <div style={{ display: 'flex', gap: '2rem' }}>
            <NavLink
              to="/"
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-primary)' : 'var(--color-foreground)',
                textDecoration: 'none',
                fontWeight: isActive ? 'bold' : 'normal',
                transition: 'color 0.2s ease'
              })}
            >
              Home
            </NavLink>
            <NavLink
              to="/songs"
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-primary)' : 'var(--color-foreground)',
                textDecoration: 'none',
                fontWeight: isActive ? 'bold' : 'normal',
                transition: 'color 0.2s ease'
              })}
            >
              Songs
            </NavLink>
            <NavLink
              to="/search"
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-primary)' : 'var(--color-foreground)',
                textDecoration: 'none',
                fontWeight: isActive ? 'bold' : 'normal',
                transition: 'color 0.2s ease'
              })}
            >
              Search
            </NavLink>
            <NavLink
              to="/setlists"
              style={({ isActive }) => ({
                color: isActive ? 'var(--color-primary)' : 'var(--color-foreground)',
                textDecoration: 'none',
                fontWeight: isActive ? 'bold' : 'normal',
                transition: 'color 0.2s ease'
              })}
            >
              Setlists
            </NavLink>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AddSongButton />
            <Suspense fallback={<ClerkComponentLoader />}>
              <LazySignedOut>
                <AuthButtons />
              </LazySignedOut>
            </Suspense>
            <Suspense fallback={<ClerkComponentLoader />}>
              <LazySignedIn>
                <UserMenu />
              </LazySignedIn>
            </Suspense>
          </div>
        </div>
      </nav>
      </ErrorBoundary>
      
      <main style={{
        flex: 1,
        backgroundColor: '#111827',
        color: 'rgba(255, 255, 255, 0.87)',
        width: '100%'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '2rem'
        }}>
          <ErrorBoundary level="section">
            {children}
          </ErrorBoundary>
        </div>
      </main>
      
      <ErrorBoundary level="section" isolate>
        <footer style={{ 
          backgroundColor: '#1e293b',
          color: '#94a3b8',
          width: '100%'
        }}>
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '1rem 2rem',
            textAlign: 'center'
          }}>
            © 2025 HSA Songbook. All rights reserved.
          </div>
        </footer>
      </ErrorBoundary>
    </div>
  )
}
