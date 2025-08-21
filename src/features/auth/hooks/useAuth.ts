import { useState, useEffect, useCallback } from 'react'
import { supabase, getCurrentSession } from '../../../lib/supabase'
import type { User, AuthState } from '../types'

// Module-level singleton for sync operations to prevent duplicates across multiple hook instances
const globalSyncState = {
  syncPromise: null as Promise<void> | null,
  lastSync: null as { userId: string; timestamp: number } | null,
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoaded: false,
    isSignedIn: false
  })

  // Sync user data to the users table with retry logic
  const syncUserData = useCallback(async (user: User, retryCount = 0): Promise<void> => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000 // 1 second
    const SYNC_COOLDOWN = 2000 // 2 seconds cooldown between syncs for the same user
    
    const now = Date.now()
    
    // If there's an active sync promise for this user, return it (deduplication)
    if (globalSyncState.syncPromise && globalSyncState.lastSync?.userId === user.id) {
      console.log('Returning existing sync promise for user:', user.id)
      return globalSyncState.syncPromise
    }
    
    // Check if we recently synced this user (within cooldown period)
    if (globalSyncState.lastSync?.userId === user.id && 
        globalSyncState.lastSync.timestamp && 
        (now - globalSyncState.lastSync.timestamp) < SYNC_COOLDOWN) {
      console.log(`User ${user.id} was synced recently, skipping (cooldown: ${SYNC_COOLDOWN}ms)`)
      return
    }
    
    // Create and store the sync promise
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
          // Check for RLS policy violation
          if (error.code === '42501' && retryCount < MAX_RETRIES) {
            console.warn(`RLS policy error, retrying (${retryCount + 1}/${MAX_RETRIES})...`, error)
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
            
            // Clear the promise before retrying
            globalSyncState.syncPromise = null
            // Retry the sync
            return await syncUserData(user, retryCount + 1)
          }
          
          // Log specific error details
          console.error('Error syncing user data:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            retryCount
          })
          
          // Don't throw the error to prevent blocking the auth flow
          // User can still use the app even if profile sync fails initially
        } else {
          console.log('User data synced successfully:', data)
        }
      } catch (error) {
        console.error('Unexpected error syncing user data:', error)
        // Don't throw - allow auth to continue even if sync fails
      } finally {
        // Clear the promise and update timestamp
        globalSyncState.syncPromise = null
        globalSyncState.lastSync = { userId: user.id, timestamp: Date.now() }
      }
    }
    
    // Store and return the promise globally
    globalSyncState.syncPromise = syncOperation()
    globalSyncState.lastSync = { userId: user.id, timestamp: now }
    return globalSyncState.syncPromise
  }, [])

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const session = await getCurrentSession()
        const user = session?.user || null
        
        setAuthState({
          user,
          session,
          isLoaded: true,
          isSignedIn: !!user
        })
        
        // Sync user data on initial load if user is already signed in
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
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user || null
        
        setAuthState({
          user,
          session,
          isLoaded: true,
          isSignedIn: !!user
        })

        // Sync user data to users table on sign in or user update
        // Skip INITIAL_SESSION as it's already handled in initializeAuth
        if (user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          // Add a small delay for new users to ensure auth is fully established
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Get authentication token (compatible with Clerk interface)
  const getToken = useCallback(async (): Promise<string | null> => {
    if (!authState.session) return null
    return authState.session.access_token
  }, [authState.session])

  // Check if user has admin role
  const isAdmin = authState.user?.email?.includes('@admin.hsa-songbook.com') || 
                  authState.user?.user_metadata?.role === 'admin'
  

  // Sign in with OAuth provider
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

  // Sign in with email and password
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

  // Sign up with email and password
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

    // Check if email confirmation is required
    if (data?.user && !data.session) {
      console.log('Email confirmation required')
    }
    
    return data
  }, [])

  // Reset password
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




  // Sign out
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }, [])

  return {
    // Clerk-compatible interface
    user: authState.user,
    userId: authState.user?.id,
    sessionId: authState.session?.access_token, // Using access_token as session identifier
    isLoaded: authState.isLoaded,
    isSignedIn: authState.isSignedIn,
    isAdmin,
    getToken,
    
    // Helper methods (Clerk-compatible)
    getUserEmail: () => authState.user?.email,
    getUserName: () => authState.user?.user_metadata?.full_name || 
                       authState.user?.user_metadata?.name || 
                       authState.user?.email?.split('@')[0] || 
                       'User',
    getUserAvatar: () => authState.user?.user_metadata?.avatar_url,
    
    // Supabase-specific methods
    session: authState.session,
    signInWithProvider,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut
  }
}