import { useAuth } from '@clerk/clerk-react'
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()

  // Still loading auth state
  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <p>Loading...</p>
      </div>
    )
  }

  // Not signed in - redirect to home with return URL
  if (!isSignedIn) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // Check admin requirement
  if (requireAdmin) {
    // You would need to check admin status from user metadata
    // This is a placeholder - implement based on your Clerk setup
    const isAdmin = false // Replace with actual admin check
    
    if (!isAdmin) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center' 
        }}>
          <h2>Access Denied</h2>
          <p>You need administrator privileges to access this page.</p>
        </div>
      )
    }
  }

  return <>{children}</>
}