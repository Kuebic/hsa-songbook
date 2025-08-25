import { createContext } from 'react'
import type { User, UserRole } from '../types'
import type { Session } from '@supabase/supabase-js'

export interface AuthContextValue {
  // State
  user: User | null
  userId: string | undefined
  sessionId: string | undefined
  isLoaded: boolean
  isSignedIn: boolean
  isAdmin: boolean
  getToken: () => Promise<string | null>
  
  // RBAC properties
  userRole: UserRole
  isModerator: boolean
  permissions: {
    canModerate: boolean
    canAdmin: boolean
  }
  customRoles: string[]
  permissionGroups: string[]
  
  // Helper methods
  getUserEmail: () => string | undefined
  getUserName: () => string
  getUserAvatar: () => string | undefined
  
  // Supabase-specific methods
  session: Session | null
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>
  signInWithEmail: (email: string, password: string, captchaToken?: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, captchaToken?: string) => Promise<{ user: User | null; session: Session | null }>
  resetPassword: (email: string, captchaToken?: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)