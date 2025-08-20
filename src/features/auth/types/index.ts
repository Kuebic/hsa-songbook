import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

// Extend the Supabase User type to include is_anonymous property
export interface User extends SupabaseUser {
  is_anonymous?: boolean
}

// Type for auth state
export interface AuthState {
  user: User | null
  session: Session | null
  isLoaded: boolean
  isSignedIn: boolean
}

// Re-export Session type from Supabase
export type { Session } from '@supabase/supabase-js'