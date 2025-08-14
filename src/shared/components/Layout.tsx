import type { ReactNode } from 'react'
import { Suspense, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LazySignedIn, LazySignedOut, ClerkComponentLoader } from '@features/auth/components/LazyClerkComponents'
import { AuthButtons, UserMenu } from '@features/auth'
import { ErrorBoundary } from '@features/monitoring'
import { AddSongButton } from '@features/songs/components/ui/AddSongButton'
import { ThemeToggle } from './ThemeToggle'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const isEditorPage = location.pathname === '/test-editor' || 
                       location.pathname.includes('/arrangements/') ||
                       location.pathname.includes('/edit')

  // Add class to root element for CSS targeting
  useEffect(() => {
    const root = document.getElementById('root')
    if (root) {
      if (isEditorPage) {
        root.classList.add('editor-page')
      } else {
        root.classList.remove('editor-page')
      }
    }
    return () => {
      const root = document.getElementById('root')
      if (root) {
        root.classList.remove('editor-page')
      }
    }
  }, [isEditorPage])

  return (
    <div style={{ 
      height: isEditorPage ? '100vh' : 'auto',
      minHeight: isEditorPage ? 'unset' : '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: isEditorPage ? 'hidden' : 'visible'
    }}>
      <ErrorBoundary level="section" isolate>
        <nav style={{ 
          backgroundColor: 'var(--nav-background)',
          color: 'var(--nav-text)',
          width: '100%'
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
                color: isActive ? 'var(--nav-active)' : 'var(--nav-text)',
                textDecoration: 'none',
                fontWeight: isActive ? 'bold' : 'normal'
              })}
            >
              Home
            </NavLink>
            <NavLink 
              to="/songs"
              style={({ isActive }) => ({
                color: isActive ? 'var(--nav-active)' : 'var(--nav-text)',
                textDecoration: 'none',
                fontWeight: isActive ? 'bold' : 'normal'
              })}
            >
              Songs
            </NavLink>
            <NavLink 
              to="/search"
              style={({ isActive }) => ({
                color: isActive ? 'var(--nav-active)' : 'var(--nav-text)',
                textDecoration: 'none',
                fontWeight: isActive ? 'bold' : 'normal'
              })}
            >
              Search
            </NavLink>
            <NavLink 
              to="/setlists"
              style={({ isActive }) => ({
                color: isActive ? 'var(--nav-active)' : 'var(--nav-text)',
                textDecoration: 'none',
                fontWeight: isActive ? 'bold' : 'normal'
              })}
            >
              Setlists
            </NavLink>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle />
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
        backgroundColor: 'var(--color-foreground)',
        width: '100%'
      }}>
        {isEditorPage ? (
          // Full width for editor pages
          <div style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden'
          }}>
            <ErrorBoundary level="section">
              {children}
            </ErrorBoundary>
          </div>
        ) : (
          // Standard width for other pages
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '2rem'
          }}>
            <ErrorBoundary level="section">
              {children}
            </ErrorBoundary>
          </div>
        )}
      </main>
      
      <ErrorBoundary level="section" isolate>
        <footer style={{ 
          backgroundColor: 'var(--nav-background)',
          color: 'var(--text-tertiary)',
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