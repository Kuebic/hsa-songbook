import type { ReactNode } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import type { UserRole } from '@features/auth/types'

interface PermissionGateProps {
  /** Children to render if permission is granted */
  children: ReactNode
  /** Required user role (user, moderator, admin) */
  requiredRole?: UserRole
  /** Required permission (moderate, admin) */
  requiredPermission?: 'moderate' | 'admin'
  /** Component to render if permission is denied */
  fallback?: ReactNode
  /** Whether to show loading state while auth is loading */
  showLoading?: boolean
}

/**
 * Permission gate component that conditionally renders children based on user permissions
 * Uses the existing auth system with JWT-based role claims
 */
export function PermissionGate({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  showLoading = true
}: PermissionGateProps) {
  const { isLoaded, userRole, permissions } = useAuth()

  // Show loading state while auth is initializing
  if (!isLoaded) {
    if (showLoading) {
      return <div className="flex items-center justify-center p-4">Loading...</div>
    }
    return null
  }

  // Check role-based permissions
  const hasRequiredRole = () => {
    if (!requiredRole) return true
    
    // Admin has access to everything
    if (userRole === 'admin') return true
    
    // Check specific role requirements
    if (requiredRole === 'admin') return userRole === 'admin'
    if (requiredRole === 'moderator') return userRole === 'moderator' || userRole === 'admin'
    
    // Everyone is at least a user
    return true
  }

  // Check permission-based access
  const hasRequiredPermission = () => {
    if (!requiredPermission) return true
    
    if (requiredPermission === 'moderate') return permissions.canModerate
    if (requiredPermission === 'admin') return permissions.canAdmin
    
    return false
  }

  // Check if user has access
  const hasAccess = hasRequiredRole() && hasRequiredPermission()

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }
    return null
  }

  return <>{children}</>
}