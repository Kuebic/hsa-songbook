import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

// Re-export Supabase User type directly
export type User = SupabaseUser

// Type for auth state
export interface AuthState {
  user: User | null
  session: Session | null
  isLoaded: boolean
  isSignedIn: boolean
}

// Re-export Session type from Supabase
export type { Session } from '@supabase/supabase-js'

// RBAC Types
export type UserRole = 'admin' | 'moderator' | 'user'

export interface RoleInfo {
  role: UserRole
  grantedBy: string
  grantedAt: string
  expiresAt?: string
  isActive: boolean
}

export interface JWTClaims {
  sub: string
  email: string
  user_role?: UserRole
  can_moderate?: boolean
  can_admin?: boolean
  custom_roles?: string[]
  permission_groups?: string[]
  exp?: number
  iat?: number
  iss?: string
  aud?: string
  role?: string
  aal?: string
  session_id?: string
  [key: string]: unknown
}

export interface AuthStateWithRoles extends AuthState {
  userRole: UserRole
  permissions: {
    canModerate: boolean
    canAdmin: boolean
  }
}