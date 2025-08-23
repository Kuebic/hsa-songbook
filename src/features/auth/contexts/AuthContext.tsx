import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase, getCurrentSession } from '../../../lib/supabase'
import { extractRoleClaims } from '../utils/jwt'
import type { User, AuthState, UserRole } from '../types'

interface AuthContextValue {
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
  session: any
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>
  signInWithEmail: (email: string, password: string, captchaToken?: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, captchaToken?: string) => Promise<any>
  resetPassword: (email: string, captchaToken?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Module-level singleton for sync operations
const globalSyncState = {
  syncPromise: null as Promise<void> | null,
  lastSync: null as { userId: string; timestamp: number } | null,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoaded: false,
    isSignedIn: false
  })
  const [userRole, setUserRole] = useState<UserRole>('user')
  const [permissions, setPermissions] = useState({
    canModerate: false,
    canAdmin: false
  })
  const [customRoles, setCustomRoles] = useState<string[]>([])
  const [permissionGroups, setPermissionGroups] = useState<string[]>([])

  // Sync user data to the users table with retry logic
  const syncUserData = useCallback(async (user: User, retryCount = 0): Promise<void> => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000
    const SYNC_COOLDOWN = 2000
    
    const now = Date.now()
    
    if (globalSyncState.syncPromise && globalSyncState.lastSync?.userId === user.id) {
      console.log('Returning existing sync promise for user:', user.id)
      return globalSyncState.syncPromise
    }
    
    if (globalSyncState.lastSync?.userId === user.id && 
        globalSyncState.lastSync.timestamp && 
        (now - globalSyncState.lastSync.timestamp) < SYNC_COOLDOWN) {
      console.log(`User ${user.id} was synced recently, skipping (cooldown: ${SYNC_COOLDOWN}ms)`)
      return
    }
    
    const syncOperation = async (): Promise<void> => {
      try {
        const userData = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          username: user.user_metadata?.preferred_username || user.user_metadata?.username || null,
          provider: user.app_metadata?.provider || 'email',
          provider_id: user.user_metadata?.provider_id || null,
          metadata: user.user_metadata || {},
          updated_at: new Date().toISOString()
        }

        console.log('Syncing user data:', { userId: user.id, email: user.email })

        const { data, error } = await supabase
          .from('users')
          .upsert(userData, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
          .single()

        if (error) {
          if (error.code === '42501' && retryCount < MAX_RETRIES) {
            console.warn(`RLS policy error, retrying (${retryCount + 1}/${MAX_RETRIES})...`, error)
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
            globalSyncState.syncPromise = null
            return await syncUserData(user, retryCount + 1)
          }
          
          console.error('Error syncing user data:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            retryCount
          })
        } else {
          console.log('User data synced successfully:', data)
        }
      } catch (error) {
        console.error('Unexpected error syncing user data:', error)
      } finally {
        globalSyncState.syncPromise = null
        globalSyncState.lastSync = { userId: user.id, timestamp: Date.now() }
      }
    }
    
    globalSyncState.syncPromise = syncOperation()
    globalSyncState.lastSync = { userId: user.id, timestamp: now }
    return globalSyncState.syncPromise
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const session = await getCurrentSession()
        const user = session?.user || null
        
        console.log('[AuthContext] Initializing auth state:', {
          hasSession: !!session,
          hasUser: !!user,
          userEmail: user?.email
        })
        
        let roleInfo = { role: 'user' as UserRole, canModerate: false, canAdmin: false, customRoles: [] as string[], permissionGroups: [] as string[] }
        if (session?.access_token) {
          roleInfo = extractRoleClaims(session.access_token)
        }
        
        const isAuthenticated = !!(user || session?.user)
        
        setAuthState({
          user: user || session?.user || null,
          session,
          isLoaded: true,
          isSignedIn: isAuthenticated
        })
        
        setUserRole(roleInfo.role)
        setPermissions({
          canModerate: roleInfo.canModerate,
          canAdmin: roleInfo.canAdmin
        })
        setCustomRoles(roleInfo.customRoles || [])
        setPermissionGroups(roleInfo.permissionGroups || [])
        
        if (user) {
          await syncUserData(user)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setAuthState({
          user: null,
          session: null,
          isLoaded: true,
          isSignedIn: false
        })
        setUserRole('user')
        setPermissions({ canModerate: false, canAdmin: false })
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user || null
        
        console.log('[AuthContext] Auth state changed:', {
          event,
          hasSession: !!session,
          hasUser: !!user,
          userEmail: user?.email
        })
        
        if (session?.access_token) {
          const roleInfo = extractRoleClaims(session.access_token)
          setUserRole(roleInfo.role)
          setPermissions({
            canModerate: roleInfo.canModerate,
            canAdmin: roleInfo.canAdmin
          })
          setCustomRoles(roleInfo.customRoles || [])
          setPermissionGroups(roleInfo.permissionGroups || [])
        } else {
          setUserRole('user')
          setPermissions({ canModerate: false, canAdmin: false })
          setCustomRoles([])
          setPermissionGroups([])
        }
        
        const isAuthenticated = !!(user || session?.user)
        
        setAuthState({
          user: user || session?.user || null,
          session,
          isLoaded: true,
          isSignedIn: isAuthenticated
        })

        if (user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          if (event === 'SIGNED_IN') {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          await syncUserData(user)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [syncUserData])

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!authState.session) return null
    return authState.session.access_token
  }, [authState.session])

  const isAdmin = permissions.canAdmin

  const signInWithProvider = useCallback(async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    })
    
    if (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string, captchaToken?: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined
    })
    
    if (error) {
      console.error('Error signing in with email:', error)
      throw error
    }
  }, [])

  const signUpWithEmail = useCallback(async (email: string, password: string, captchaToken?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        ...(captchaToken && { captchaToken })
      }
    })
    
    if (error) {
      console.error('Error signing up:', error)
      throw error
    }

    if (data?.user && !data.session) {
      console.log('Email confirmation required')
    }
    
    return data
  }, [])

  const resetPassword = useCallback(async (email: string, captchaToken?: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      ...(captchaToken && { captchaToken })
    })
    
    if (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }, [])

  const value: AuthContextValue = {
    user: authState.user,
    userId: authState.user?.id,
    sessionId: authState.session?.access_token,
    isLoaded: authState.isLoaded,
    isSignedIn: authState.isSignedIn,
    isAdmin,
    getToken,
    
    userRole,
    isModerator: permissions.canModerate,
    permissions,
    customRoles,
    permissionGroups,
    
    getUserEmail: () => authState.user?.email,
    getUserName: () => authState.user?.user_metadata?.full_name || 
                       authState.user?.user_metadata?.name || 
                       authState.user?.email?.split('@')[0] || 
                       'User',
    getUserAvatar: () => authState.user?.user_metadata?.avatar_url,
    
    session: authState.session,
    signInWithProvider,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}