import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AuthButtons, UserMenu } from '@features/auth'
import { useAuth } from '@features/auth/hooks/useAuth'
import { ErrorBoundary } from '@features/monitoring'
import { AddSongButton } from '@features/songs/components/ui/AddSongButton'
import { ThemeToggle } from './ThemeToggle'
// NEW IMPORTS
import { MobileNavigation } from '@features/responsive/components/MobileNavigation'
import { useViewport } from '@features/responsive/hooks/useViewport'
import { useResponsiveNav } from '@features/responsive/hooks/useResponsiveNav'
import './layout.css'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { isSignedIn, isLoaded, isAdmin } = useAuth()
  const viewport = useViewport()
  const nav = useResponsiveNav()
  
  const isEditorPage = location.pathname === '/test-editor' || 
                       location.pathname.includes('/arrangements/') ||
                       location.pathname.includes('/edit')

  const navItems = useMemo(() => {
    const baseItems = [
      { to: '/', label: 'Home' },
      { to: '/songs', label: 'Songs' },
      { to: '/search', label: 'Search' },
      { to: '/setlists', label: 'Setlists' }
    ]
    
    // Add Admin link if user has admin permissions
    if (isAdmin) {
      baseItems.push({ to: '/admin', label: 'Admin' })
    }
    
    return baseItems
  }, [isAdmin])

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
    <div className={`layout-container ${isEditorPage ? 'editor-page' : ''}`}>
      <ErrorBoundary level="section" isolate>
        <nav className="nav-header">
          <div className="nav-container">
            {/* Mobile Navigation */}
            {viewport.isMobile && (
              <MobileNavigation 
                items={navItems}
                isOpen={nav.isMenuOpen}
                onToggle={nav.toggleMenu}
                onClose={nav.closeMenu}
              />
            )}

            {/* Desktop Navigation */}
            {!viewport.isMobile && (
              <>
                <div className="nav-brand">
                  <h1>🎵 HSA Songbook</h1>
                </div>
                
                <div className="nav-links">
                  {navItems.map(item => (
                    <NavLink 
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => 
                        `nav-link ${isActive ? 'active' : ''}`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </>
            )}

            {/* Mobile Brand (when menu is not open) */}
            {viewport.isMobile && !nav.isMenuOpen && (
              <div className="nav-brand-mobile">
                <h1>🎵 HSA</h1>
              </div>
            )}
            
            <div className="nav-actions">
              <ThemeToggle />
              <AddSongButton />
              {!isLoaded ? (
                // Show loading spinner while auth is loading
                <div style={{ 
                  width: '2rem', 
                  height: '2rem', 
                  borderRadius: '50%',
                  border: '2px solid #e5e7eb',
                  borderTopColor: '#3b82f6',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (
                <>
                  {!isSignedIn && <AuthButtons />}
                  {isSignedIn && <UserMenu />}
                </>
              )}
            </div>
          </div>
        </nav>
      </ErrorBoundary>
      
      <main className="main-content">
        <ErrorBoundary level="section">
          {children}
        </ErrorBoundary>
      </main>
      
      {!isEditorPage && (
        <ErrorBoundary level="section" isolate>
          <footer className="footer">
            <div className="footer-content">
              © 2025 HSA Songbook. All rights reserved.
            </div>
          </footer>
        </ErrorBoundary>
      )}
    </div>
  )
}