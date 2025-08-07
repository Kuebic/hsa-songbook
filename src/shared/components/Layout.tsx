import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { AuthButtons, UserMenu } from '@features/auth'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ 
        backgroundColor: '#1e293b',
        padding: '1rem 2rem',
        color: 'white'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
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
            <SignedOut>
              <AuthButtons />
            </SignedOut>
            <SignedIn>
              <UserMenu />
            </SignedIn>
          </div>
        </div>
      </nav>
      
      <main style={{ 
        flex: 1,
        backgroundColor: '#f8fafc',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        {children}
      </main>
      
      <footer style={{ 
        backgroundColor: '#1e293b',
        color: '#94a3b8',
        padding: '1rem',
        textAlign: 'center'
      }}>
        © 2025 HSA Songbook. All rights reserved.
      </footer>
    </div>
  )
}