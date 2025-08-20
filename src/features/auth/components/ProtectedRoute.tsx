import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, isAdmin } = useAuth()
  const location = useLocation()

  // Still loading auth state
  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading...</p>
      </div>
    )
  }

  // Not signed in - redirect to home with return URL
  if (!isSignedIn) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        maxWidth: '400px',
        margin: '0 auto',
        marginTop: '4rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ 
          color: '#1f2937', 
          marginBottom: '0.5rem',
          fontSize: '1.5rem'
        }}>
          Access Denied
        </h2>
        <p style={{ 
          color: '#6b7280',
          lineHeight: '1.5'
        }}>
          You need administrator privileges to access this page.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            marginTop: '1.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6'
          }}
        >
          Go Back
        </button>
      </div>
    )
  }

  return <>{children}</>
}