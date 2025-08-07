import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { NavLink } from 'react-router-dom'
import { LazySignedIn, LazySignedOut, ClerkComponentLoader } from '@features/auth/components/LazyClerkComponents'
import { AuthButtons, UserMenu } from '@features/auth'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ 
        backgroundColor: '#1e293b',
        color: 'white',
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
                color: isActive ? '#60a5fa' : 'white',
                textDecoration: 'none',
                fontWeight: isActive ? 'bold' : 'normal'
              })}
            >
              Home
            </NavLink>
            <NavLink 
              to="/songs"
              style={({ isActive }) => ({
                color: isActive ? '#60a5fa' : 'white',
                textDecoration: 'none',
                fontWeight: isActive ? 'bold' : 'normal'
              })}
            >
              Songs
            </NavLink>
            <NavLink 
              to="/search"
              style={({ isActive }) => ({
                color: isActive ? '#60a5fa' : 'white',
                textDecoration: 'none',
                fontWeight: isActive ? 'bold' : 'normal'
              })}
            >
              Search
            </NavLink>
            <NavLink 
              to="/setlists"
              style={({ isActive }) => ({
                color: isActive ? '#60a5fa' : 'white',
                textDecoration: 'none',
                fontWeight: isActive ? 'bold' : 'normal'
              })}
            >
              Setlists
            </NavLink>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
      
      <main style={{ 
        flex: 1,
        backgroundColor: '#f8fafc',
        width: '100%'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '2rem'
        }}>
          {children}
        </div>
      </main>
      
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
    </div>
  )
}