import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { createMockUser } from '@shared/test-utils/clerk-test-utils'
import { mockUseUser, mockUseAuth as mockClerkUseAuth } from '@shared/test-utils/setup'

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic auth state', () => {
    it('returns not signed in state by default', () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        user: null,
      })
      mockClerkUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        userId: null,
        sessionId: null,
        getToken: vi.fn(),
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.isSignedIn).toBe(false)
      expect(result.current.userId).toBe(null)
      expect(result.current.user).toBe(null)
      expect(result.current.isLoaded).toBe(true)
      expect(result.current.isAdmin).toBeFalsy() // isAdmin will be undefined when user is null
    })

    it('returns signed in state with user data', () => {
      const mockUser = createMockUser({
        id: 'user_123',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
      })

      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      })
      mockClerkUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'user_123',
        sessionId: 'session_456',
        getToken: vi.fn(),
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.isSignedIn).toBe(true)
      expect(result.current.userId).toBe('user_123')
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.sessionId).toBe('session_456')
    })

    it('returns loading state', () => {
      mockUseUser.mockReturnValue({
        isLoaded: false,
        isSignedIn: false,
        user: null,
      })
      mockClerkUseAuth.mockReturnValue({
        isLoaded: false,
        isSignedIn: false,
        userId: null,
        sessionId: null,
        getToken: vi.fn(),
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.isLoaded).toBe(false)
    })
  })

  describe('admin detection', () => {
    it('detects admin role from publicMetadata', () => {
      const mockUser = createMockUser({
        publicMetadata: { role: 'admin' },
      })

      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.isAdmin).toBe(true)
    })

    it('detects admin from email domain', () => {
      const mockUser = createMockUser({
        emailAddresses: [
          { emailAddress: 'admin@admin.hsa-songbook.com', id: 'email_1' },
        ],
      })

      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.isAdmin).toBe(true)
    })

    it('returns false for non-admin users', () => {
      const mockUser = createMockUser({
        publicMetadata: { role: 'user' },
        emailAddresses: [
          { emailAddress: 'user@example.com', id: 'email_1' },
        ],
      })

      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.isAdmin).toBe(false)
    })
  })

  describe('helper methods', () => {
    it('getUserEmail returns primary email', () => {
      const mockUser = createMockUser({
        primaryEmailAddress: { emailAddress: 'test@example.com' },
      })

      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.getUserEmail()).toBe('test@example.com')
    })

    it('getUserName returns full name', () => {
      const mockUser = createMockUser({
        fullName: 'John Doe',
        firstName: 'John',
      })

      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.getUserName()).toBe('John Doe')
    })

    it('getUserName returns first name if no full name', () => {
      const mockUser = createMockUser({
        fullName: undefined,
        firstName: 'Jane',
      })

      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.getUserName()).toBe('Jane')
    })

    it('getUserName returns default if no name', () => {
      const mockUser = createMockUser({
        fullName: undefined,
        firstName: undefined,
      })

      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.getUserName()).toBe('User')
    })

    it('getUserAvatar returns image URL', () => {
      const mockUser = createMockUser({
        imageUrl: 'https://example.com/avatar.jpg',
      })

      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: mockUser,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.getUserAvatar()).toBe('https://example.com/avatar.jpg')
    })

    it('helper methods return undefined when not signed in', () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        user: null,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.getUserEmail()).toBeUndefined()
      expect(result.current.getUserName()).toBe('User')
      expect(result.current.getUserAvatar()).toBeUndefined()
    })
  })

  describe('getToken function', () => {
    it('provides getToken function', () => {
      const getToken = vi.fn()
      mockClerkUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'user_123',
        sessionId: 'session_456',
        getToken,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.getToken).toBe(getToken)
    })
  })
})