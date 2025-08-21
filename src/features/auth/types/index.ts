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