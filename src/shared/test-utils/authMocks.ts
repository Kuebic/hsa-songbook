import { vi } from 'vitest'
import { type AuthContextValue } from '@features/auth/contexts/AuthContext'
import type { User } from '@features/auth/types'

/**
 * Create a complete mock for the useAuth hook
 * All optional fields are properly typed to avoid test failures
 */
export const createAuthMock = (
  overrides: Partial<AuthContextValue> = {}
): AuthContextValue => ({
  // State
  user: null,
  userId: undefined,
  sessionId: undefined,
  isLoaded: false,
  isSignedIn: false,
  isAdmin: false,
  
  // RBAC properties - ALWAYS provide arrays, never undefined
  userRole: 'user' as const,
  isModerator: false,
  permissions: {
    canModerate: false,
    canAdmin: false
  },
  customRoles: [],  // Always an array
  permissionGroups: [],  // Always an array
  
  // Helper methods
  getToken: vi.fn().mockResolvedValue(null),
  getUserEmail: vi.fn().mockReturnValue(undefined),
  getUserName: vi.fn().mockReturnValue('User'),
  getUserAvatar: vi.fn().mockReturnValue(undefined),
  
  // Supabase methods
  session: null,
  signInWithProvider: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  resetPassword: vi.fn(),
  signOut: vi.fn(),
  
  // Apply overrides last to allow customization
  ...overrides
})

/**
 * Create a mock user object for testing
 */
export const createUserMock = (
  overrides: Partial<User> = {}
): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  ...overrides
} as User)

/**
 * Create an authenticated auth mock with a user
 */
export const createAuthenticatedMock = (
  userId = 'test-user-id',
  overrides: Partial<AuthContextValue> = {}
): AuthContextValue => {
  const user = createUserMock({ id: userId })
  return createAuthMock({
    user,
    userId,
    sessionId: 'test-session',
    isLoaded: true,
    isSignedIn: true,
    getUserEmail: vi.fn().mockReturnValue(user.email),
    ...overrides
  })
}

/**
 * Create an admin auth mock
 */
export const createAdminMock = (
  overrides: Partial<AuthContextValue> = {}
): AuthContextValue => {
  return createAuthenticatedMock('admin-user-id', {
    isAdmin: true,
    userRole: 'admin',
    permissions: {
      canModerate: true,
      canAdmin: true
    },
    ...overrides
  })
}

/**
 * Create a moderator auth mock
 */
export const createModeratorMock = (
  overrides: Partial<AuthContextValue> = {}
): AuthContextValue => {
  return createAuthenticatedMock('moderator-user-id', {
    userRole: 'moderator',
    isModerator: true,
    permissions: {
      canModerate: true,
      canAdmin: false
    },
    ...overrides
  })
}