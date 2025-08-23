import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { extractRoleClaims } from '../utils/jwt'
import type { UserRole } from '../types'

/**
 * Hook for managing user roles and permissions based on JWT claims
 * @returns Object containing role information and permission checking utilities
 */
export function useRoles() {
  const [userRole, setUserRole] = useState<UserRole>('user')
  const [permissions, setPermissions] = useState({
    canModerate: false,
    canAdmin: false
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.access_token) {
          const roleClaims = extractRoleClaims(session.access_token)
          setUserRole(roleClaims.role)
          setPermissions({
            canModerate: roleClaims.canModerate,
            canAdmin: roleClaims.canAdmin
          })
        } else {
          // Default to user role when no session
          setUserRole('user')
          setPermissions({ canModerate: false, canAdmin: false })
        }
      } catch (error) {
        console.error('Error loading user roles:', error)
        // Default to user role on error
        setUserRole('user')
        setPermissions({ canModerate: false, canAdmin: false })
      } finally {
        setLoading(false)
      }
    }

    loadRoles()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.access_token) {
          try {
            const roleClaims = extractRoleClaims(session.access_token)
            setUserRole(roleClaims.role)
            setPermissions({
              canModerate: roleClaims.canModerate,
              canAdmin: roleClaims.canAdmin
            })
          } catch (error) {
            console.error('Error extracting role claims:', error)
            setUserRole('user')
            setPermissions({ canModerate: false, canAdmin: false })
          }
        } else {
          setUserRole('user')
          setPermissions({ canModerate: false, canAdmin: false })
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  /**
   * Check if the user has a specific permission
   * @param permission - The permission to check ('moderate' or 'admin')
   * @returns True if the user has the permission
   */
  const hasPermission = (permission: 'moderate' | 'admin'): boolean => {
    if (permission === 'moderate') return permissions.canModerate
    if (permission === 'admin') return permissions.canAdmin
    return false
  }

  /**
   * Check if the user is in a specific role or higher
   * @param role - The role to check
   * @returns True if the user has the role or a higher role
   */
  const isInRole = (role: UserRole): boolean => {
    if (role === 'admin') return userRole === 'admin'
    if (role === 'moderator') return userRole === 'moderator' || userRole === 'admin'
    return true // Everyone is at least a 'user'
  }

  /**
   * Refresh the user's role from the server
   * Useful after role changes that require a new token
   */
  const refreshRole = async () => {
    setLoading(true)
    try {
      // Refresh the session to get a new token with updated claims
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Error refreshing session:', error)
        return
      }
      
      if (session?.access_token) {
        const roleClaims = extractRoleClaims(session.access_token)
        setUserRole(roleClaims.role)
        setPermissions({
          canModerate: roleClaims.canModerate,
          canAdmin: roleClaims.canAdmin
        })
      }
    } catch (error) {
      console.error('Error refreshing role:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    userRole,
    permissions,
    loading,
    hasPermission,
    isInRole,
    isModerator: permissions.canModerate,
    isAdmin: permissions.canAdmin,
    refreshRole
  }
}