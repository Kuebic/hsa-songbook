import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { supabase, getCurrentSession } from '../../../lib/supabase'
import { logger } from '../../../lib/logger'
import { extractRoleClaims } from '../utils/jwt'
import type { User, AuthState, UserRole } from '../types'
import type { Session } from '@supabase/supabase-js'

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
  session: Session | null
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>
  signInWithEmail: (email: string, password: string, captchaToken?: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, captchaToken?: string) => Promise<{ user: User | null; session: Session | null }>
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
      logger.info('Returning existing sync promise for user:', user.id)
      return globalSyncState.syncPromise
    }
    
    if (globalSyncState.lastSync?.userId === user.id && 
        globalSyncState.lastSync.timestamp && 
        (now - globalSyncState.lastSync.timestamp) < SYNC_COOLDOWN) {
      logger.info(`User ${user.id} was synced recently, skipping (cooldown: ${SYNC_COOLDOWN}ms)`)
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

        logger.info('Syncing user data:', { userId: user.id, email: user.email })

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
            logger.warn(`RLS policy error, retrying (${retryCount + 1}/${MAX_RETRIES})`, error)
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
            globalSyncState.syncPromise = null
            return await syncUserData(user, retryCount + 1)
          }
          
          logger.error('Error syncing user data:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            retryCount
          })
        } else {
          logger.info('User data synced successfully:', data)
        }
      } catch (error) {
        logger.error('Unexpected error syncing user data:', error)
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
        
        logger.info('[AuthContext] Initializing auth state:', {
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
        setCustomRoles(roleInfo.customRoles)
        setPermissionGroups(roleInfo.permissionGroups)
        
        if (user) {
          await syncUserData(user)
        }
      } catch (error) {
        logger.error('Error initializing auth:', error)
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
        
        logger.info('[AuthContext] Auth state changed:', {
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
      logger.error('Error signing in:', error)
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
      logger.error('Error signing in with email:', error)
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
      logger.error('Error signing up:', error)
      throw error
    }

    if (data?.user && !data.session) {
      logger.info('Email confirmation required')
    }
    
    return data
  }, [])

  const resetPassword = useCallback(async (email: string, captchaToken?: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      ...(captchaToken && { captchaToken })
    })
    
    if (error) {
      logger.error('Error resetting password:', error)
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    // Create a timeout promise (5 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Sign out timed out after 5 seconds')), 5000)
    })
    
    try {
      // Race between signOut and timeout
      await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise
      ])
      
      logger.info('Supabase sign out succeeded')
      
      // Clear local auth state as confirmation
      setAuthState({
        user: null,
        session: null,
        isLoaded: true,
        isSignedIn: false
      })
    } catch (error) {
      logger.error('Error or timeout during sign out:', error)
      
      // Force clear local state even if Supabase fails
      setAuthState({
        user: null,
        session: null,
        isLoaded: true,
        isSignedIn: false
      })
      
      // Clear any stored session data
      if (typeof window !== 'undefined') {
        // Clear Supabase-specific storage
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.startsWith('supabase.auth.') || key.startsWith('sb-')
        )
        keysToRemove.forEach(key => localStorage.removeItem(key))
        
        // Also clear session storage
        sessionStorage.clear()
      }
      
      logger.info('Local auth state cleared despite Supabase error')
      // Don't throw - we've cleared local state, that's enough
    }
  }, [])

  const getUserEmail = useCallback(() => authState.user?.email, [authState.user])
  
  const getUserName = useCallback(() => 
    authState.user?.user_metadata?.full_name || 
    authState.user?.user_metadata?.name || 
    authState.user?.email?.split('@')[0] || 
    'User', 
    [authState.user]
  )
  
  const getUserAvatar = useCallback(() => authState.user?.user_metadata?.avatar_url, [authState.user])

  const value: AuthContextValue = useMemo(() => ({
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
    
    getUserEmail,
    getUserName,
    getUserAvatar,
    
    session: authState.session,
    signInWithProvider,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut
  }), [
    authState.user,
    authState.session,
    authState.isLoaded,
    authState.isSignedIn,
    isAdmin,
    getToken,
    userRole,
    permissions,
    customRoles,
    permissionGroups,
    getUserEmail,
    getUserName,
    getUserAvatar,
    signInWithProvider,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut
  ])

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