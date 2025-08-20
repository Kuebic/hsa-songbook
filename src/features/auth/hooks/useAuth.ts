import { useState, useEffect, useCallback } from 'react'
import { supabase, getCurrentSession } from '../../../lib/supabase'
import type { User, AuthState } from '../types'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoaded: false,
    isSignedIn: false
  })

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

        // Sync user data to users table on sign in or initial session
        if (user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED')) {
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
  }, [])

  // Sync user data to the users table with retry logic
  const syncUserData = async (user: User, retryCount = 0) => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000 // 1 second
    
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
    }
  }

  // Get authentication token (compatible with Clerk interface)
  const getToken = useCallback(async (): Promise<string | null> => {
    if (!authState.session) return null
    return authState.session.access_token
  }, [authState.session])

  // Check if user has admin role
  const isAdmin = authState.user?.email?.includes('@admin.hsa-songbook.com') || 
                  authState.user?.user_metadata?.role === 'admin'
  
  // Check if user is anonymous
  const isAnonymous = authState.user?.is_anonymous === true

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

  // Sign in anonymously
  const signInAnonymously = useCallback(async (captchaToken?: string) => {
    const { data, error } = await supabase.auth.signInAnonymously(
      captchaToken ? { options: { captchaToken } } : undefined
    )
    
    if (error) {
      console.error('Error signing in anonymously:', error)
      throw error
    }
    
    return data
  }, [])

  // Convert anonymous user to permanent user by linking email
  const linkEmailToAnonymousUser = useCallback(async (email: string, password?: string) => {
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      email,
      ...(password && { password })
    })
    
    if (updateError) {
      console.error('Error linking email to anonymous user:', updateError)
      throw updateError
    }
    
    return updateData
  }, [])

  // Convert anonymous user to permanent user by linking OAuth
  const linkOAuthToAnonymousUser = useCallback(async (provider: 'google' | 'github') => {
    const { data, error } = await supabase.auth.linkIdentity({ 
      provider,
      options: {
        redirectTo: window.location.origin
      }
    })
    
    if (error) {
      console.error('Error linking OAuth to anonymous user:', error)
      throw error
    }
    
    return data
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
    isAnonymous,
    getToken,
    
    // Helper methods (Clerk-compatible)
    getUserEmail: () => authState.user?.email,
    getUserName: () => authState.user?.user_metadata?.full_name || 
                       authState.user?.user_metadata?.name || 
                       authState.user?.email?.split('@')[0] || 
                       (isAnonymous ? 'Guest User' : 'User'),
    getUserAvatar: () => authState.user?.user_metadata?.avatar_url,
    
    // Supabase-specific methods
    session: authState.session,
    signInWithProvider,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signInAnonymously,
    linkEmailToAnonymousUser,
    linkOAuthToAnonymousUser,
    signOut
  }
}