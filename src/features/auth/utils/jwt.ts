import { jwtDecode } from 'jwt-decode'
import type { JWTClaims, UserRole } from '../types'

/**
 * Safely decode a JWT token and extract claims
 * @param token - The JWT token to decode
 * @returns The decoded JWT claims or null if decoding fails
 */
export function decodeJWT(token: string): JWTClaims | null {
  try {
    return jwtDecode<JWTClaims>(token)
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Extract role-related claims from a JWT token
 * @param token - The JWT token to extract claims from
 * @returns Object containing role, canModerate, and canAdmin flags
 */
export function extractRoleClaims(token: string): {
  role: UserRole
  canModerate: boolean
  canAdmin: boolean
} {
  const claims = decodeJWT(token)
  
  return {
    role: (claims?.user_role as UserRole) || 'user',
    canModerate: claims?.can_moderate || false,
    canAdmin: claims?.can_admin || false
  }
}

/**
 * Check if a JWT token has a specific role
 * @param token - The JWT token to check
 * @param role - The role to check for
 * @returns True if the token has the specified role or higher
 */
export function hasRole(token: string, role: UserRole): boolean {
  const claims = extractRoleClaims(token)
  
  switch (role) {
    case 'admin':
      return claims.role === 'admin'
    case 'moderator':
      return claims.role === 'admin' || claims.role === 'moderator'
    case 'user':
      return true // Everyone has at least user role
    default:
      return false
  }
}

/**
 * Get the expiration time of a JWT token
 * @param token - The JWT token to check
 * @returns The expiration timestamp or null if not available
 */
export function getTokenExpiration(token: string): number | null {
  const claims = decodeJWT(token)
  return claims?.exp || null
}

/**
 * Check if a JWT token is expired
 * @param token - The JWT token to check
 * @returns True if the token is expired
 */
export function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiration(token)
  if (!exp) return true
  
  // Compare with current time (exp is in seconds, Date.now() is in milliseconds)
  return exp * 1000 < Date.now()
}