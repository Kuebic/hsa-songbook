import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useArrangementMutations } from '../mutations/useArrangementMutations'
import type { ArrangementFormData } from '../../validation/schemas/arrangementFormSchema'
import type { Arrangement } from '../../types/song.types'
import * as arrangementServiceModule from '../../services/arrangementService'
import * as authModule from '@features/auth'

// Mock the dependencies
vi.mock('@features/auth', () => ({
  useAuth: vi.fn(() => ({
    isSignedIn: true,
    userId: 'user-123',
    getToken: vi.fn().mockResolvedValue('mock-token')
  }))
}))

vi.mock('../../services/arrangementService', () => ({
  arrangementService: {
    createArrangement: vi.fn(),
    updateArrangement: vi.fn(),
    deleteArrangement: vi.fn()
  }
}))

const mockArrangementService = vi.mocked(arrangementServiceModule.arrangementService)
const mockUseAuth = vi.mocked(authModule.useAuth)

describe('useArrangementMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset auth mock to default state
    mockUseAuth.mockReturnValue({
      isSignedIn: true,
      userId: 'user-123',
      getToken: vi.fn().mockResolvedValue('mock-token')
    })
  })

  describe('createArrangement', () => {
    it('should create arrangement successfully', async () => {
      const mockArrangement: Arrangement = {
        id: 'arrangement-123',
        name: 'Test Arrangement',
        slug: 'test-arrangement',
        songIds: ['song-123'],
        key: 'C',
        difficulty: 'beginner',
        tags: ['acoustic'],
        chordData: '{title: Test}',
        createdBy: 'user-123',
        metadata: { isPublic: true, views: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      mockArrangementService.createArrangement.mockResolvedValue(mockArrangement)

      const { result } = renderHook(() => useArrangementMutations())

      const formData: ArrangementFormData = {
        name: 'Test Arrangement',
        songIds: ['song-123'],
        key: 'C',
        tempo: undefined,
        capo: undefined, 
        duration: undefined,
        difficulty: 'beginner',
        tags: ['acoustic'],
        chordProText: '{title: Test}',
        description: undefined,
        notes: undefined
      }

      let createdArrangement: Arrangement
      await act(async () => {
        createdArrangement = await result.current.createArrangement(formData)
      })

      expect(mockArrangementService.createArrangement).toHaveBeenCalledWith(formData)
      expect(createdArrangement!).toEqual(mockArrangement)
      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should set isSubmitting during creation', async () => {
      const mockArrangement: Arrangement = {
        id: 'arrangement-123',
        name: 'Test Arrangement',
        slug: 'test-arrangement',
        songIds: ['song-123'],
        key: 'C',
        difficulty: 'beginner',
        tags: [],
        chordData: '',
        createdBy: 'user-123',
        metadata: { isPublic: true, views: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Delay the mock to test isSubmitting state
      mockArrangementService.createArrangement.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockArrangement), 100))
      )

      const { result } = renderHook(() => useArrangementMutations())

      const formData: ArrangementFormData = {
        name: 'Test Arrangement',
        songIds: ['song-123'],
        difficulty: 'beginner'
      }

      act(() => {
        result.current.createArrangement(formData)
      })

      expect(result.current.isSubmitting).toBe(true)

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false)
      })
    })

    it('should handle creation errors', async () => {
      const errorMessage = 'Failed to create arrangement'
      mockArrangementService.createArrangement.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useArrangementMutations())

      const formData: ArrangementFormData = {
        name: 'Test Arrangement',
        songIds: ['song-123'],
        difficulty: 'beginner'
      }

      await act(async () => {
        try {
          await result.current.createArrangement(formData)
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe(errorMessage)
        }
      })

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.isSubmitting).toBe(false)
    })

    it('should require authentication', async () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        userId: null,
        getToken: vi.fn()
      })

      const { result } = renderHook(() => useArrangementMutations())

      const formData: ArrangementFormData = {
        name: 'Test Arrangement',
        songIds: ['song-123'],
        difficulty: 'beginner'
      }

      await act(async () => {
        try {
          await result.current.createArrangement(formData)
        } catch (error) {
          expect((error as Error).message).toBe('Please sign in to create arrangements')
        }
      })

      expect(mockArrangementService.createArrangement).not.toHaveBeenCalled()
    })

    it('should handle missing authentication token', async () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        userId: 'user-123',
        getToken: vi.fn().mockResolvedValue(null)
      })

      const { result } = renderHook(() => useArrangementMutations())

      const formData: ArrangementFormData = {
        name: 'Test Arrangement',
        songIds: ['song-123'],
        difficulty: 'beginner'
      }

      await act(async () => {
        try {
          await result.current.createArrangement(formData)
        } catch (error) {
          expect((error as Error).message).toBe('Unable to get authentication token')
        }
      })

      expect(mockArrangementService.createArrangement).not.toHaveBeenCalled()
    })
  })

  describe('updateArrangement', () => {
    it('should update arrangement successfully', async () => {
      const mockArrangement: Arrangement = {
        id: 'arrangement-123',
        name: 'Updated Arrangement',
        slug: 'updated-arrangement',
        songIds: ['song-123'],
        difficulty: 'intermediate',
        tags: ['acoustic', 'fingerpicking'],
        chordData: '{title: Updated}',
        createdBy: 'user-123',
        metadata: { isPublic: true, views: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      mockArrangementService.updateArrangement.mockResolvedValue(mockArrangement)

      const { result } = renderHook(() => useArrangementMutations())

      const updateData: Partial<ArrangementFormData> = {
        name: 'Updated Arrangement',
        difficulty: 'intermediate',
        tags: ['acoustic', 'fingerpicking']
      }

      let updatedArrangement: Arrangement
      await act(async () => {
        updatedArrangement = await result.current.updateArrangement('arrangement-123', updateData)
      })

      expect(mockArrangementService.updateArrangement).toHaveBeenCalledWith('arrangement-123', updateData)
      expect(updatedArrangement!).toEqual(mockArrangement)
      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle update errors', async () => {
      const errorMessage = 'Failed to update arrangement'
      mockArrangementService.updateArrangement.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useArrangementMutations())

      const updateData: Partial<ArrangementFormData> = {
        name: 'Updated Arrangement'
      }

      await act(async () => {
        try {
          await result.current.updateArrangement('arrangement-123', updateData)
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe(errorMessage)
        }
      })

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.isSubmitting).toBe(false)
    })

    it('should require authentication for updates', async () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        userId: null,
        getToken: vi.fn()
      })

      const { result } = renderHook(() => useArrangementMutations())

      const updateData: Partial<ArrangementFormData> = {
        name: 'Updated Arrangement'
      }

      await act(async () => {
        try {
          await result.current.updateArrangement('arrangement-123', updateData)
        } catch (error) {
          expect((error as Error).message).toBe('Please sign in to update arrangements')
        }
      })

      expect(mockArrangementService.updateArrangement).not.toHaveBeenCalled()
    })
  })

  describe('deleteArrangement', () => {
    it('should delete arrangement successfully', async () => {
      mockArrangementService.deleteArrangement.mockResolvedValue(undefined)

      const { result } = renderHook(() => useArrangementMutations())

      await act(async () => {
        await result.current.deleteArrangement('arrangement-123')
      })

      expect(mockArrangementService.deleteArrangement).toHaveBeenCalledWith('arrangement-123')
      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle deletion errors', async () => {
      const errorMessage = 'Failed to delete arrangement'
      mockArrangementService.deleteArrangement.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useArrangementMutations())

      await act(async () => {
        try {
          await result.current.deleteArrangement('arrangement-123')
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe(errorMessage)
        }
      })

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.isSubmitting).toBe(false)
    })

    it('should require authentication for deletion', async () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        userId: null,
        getToken: vi.fn()
      })

      const { result } = renderHook(() => useArrangementMutations())

      await act(async () => {
        try {
          await result.current.deleteArrangement('arrangement-123')
        } catch (error) {
          expect((error as Error).message).toBe('Please sign in to delete arrangements')
        }
      })

      expect(mockArrangementService.deleteArrangement).not.toHaveBeenCalled()
    })
  })

  describe('rateArrangement', () => {
    it('should throw error for unimplemented rating functionality', async () => {
      const { result } = renderHook(() => useArrangementMutations())

      await act(async () => {
        try {
          await result.current.rateArrangement('arrangement-123', 5)
        } catch (error) {
          expect((error as Error).message).toBe('Arrangement rating is not yet implemented')
        }
      })
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockArrangementService.createArrangement.mockRejectedValue(new Error('Test error'))

      const { result } = renderHook(() => useArrangementMutations())

      // Create an error
      await act(async () => {
        try {
          await result.current.createArrangement({
            name: 'Test',
            songIds: ['song-123'],
            difficulty: 'beginner'
          })
        } catch {
          // Expected to fail
        }
      })

      expect(result.current.error).toBe('Test error')

      // Clear the error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })
  })

  describe('authentication state', () => {
    it('should return correct authentication status', () => {
      const { result } = renderHook(() => useArrangementMutations())

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.canCreateArrangements).toBe(true)
    })

    it('should return false for unauthenticated user', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        userId: null,
        getToken: vi.fn()
      })

      const { result } = renderHook(() => useArrangementMutations())

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.canCreateArrangements).toBe(false)
    })

    it('should handle user without userId', () => {
      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        userId: null,
        getToken: vi.fn().mockResolvedValue('token')
      })

      const { result } = renderHook(() => useArrangementMutations())

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.canCreateArrangements).toBe(false)
    })
  })

  describe('loading states', () => {
    it('should handle concurrent operations correctly', async () => {
      const mockArrangement: Arrangement = {
        id: 'arrangement-123',
        name: 'Test Arrangement',
        slug: 'test-arrangement',
        songIds: ['song-123'],
        key: 'C',
        difficulty: 'beginner',
        tags: [],
        chordData: '',
        createdBy: 'user-123',
        metadata: { isPublic: true, views: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Mock delayed responses
      mockArrangementService.createArrangement.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockArrangement), 100))
      )
      mockArrangementService.updateArrangement.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockArrangement), 150))
      )

      const { result } = renderHook(() => useArrangementMutations())

      // Start create operation
      act(() => {
        result.current.createArrangement({
          name: 'Test',
          songIds: ['song-123'],
          difficulty: 'beginner'
        })
      })

      expect(result.current.isSubmitting).toBe(true)

      // Wait for create to complete
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false)
      })

      // Start update operation
      act(() => {
        result.current.updateArrangement('arrangement-123', { name: 'Updated' })
      })

      expect(result.current.isSubmitting).toBe(true)

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false)
      })
    })
  })

  describe('error handling edge cases', () => {
    it('should handle non-Error objects thrown from service', async () => {
      mockArrangementService.createArrangement.mockRejectedValue('String error')

      const { result } = renderHook(() => useArrangementMutations())

      await act(async () => {
        try {
          await result.current.createArrangement({
            name: 'Test',
            songIds: ['song-123'],
            difficulty: 'beginner'
          })
        } catch (error) {
          expect((error as Error).message).toBe('Failed to create arrangement')
        }
      })

      expect(result.current.error).toBe('Failed to create arrangement')
    })

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Network timeout')
      timeoutError.name = 'TimeoutError'
      mockArrangementService.createArrangement.mockRejectedValue(timeoutError)

      const { result } = renderHook(() => useArrangementMutations())

      await act(async () => {
        try {
          await result.current.createArrangement({
            name: 'Test',
            songIds: ['song-123'],
            difficulty: 'beginner'
          })
        } catch (error) {
          expect((error as Error).message).toBe('Network timeout')
        }
      })

      expect(result.current.error).toBe('Network timeout')
    })
  })

  describe('form data validation', () => {
    it('should pass through complete form data', async () => {
      const mockArrangement: Arrangement = {
        id: 'arrangement-123',
        name: 'Complete Arrangement',
        slug: 'complete-arrangement',
        songIds: ['song-123'],
        key: 'C',
        tempo: 120,
        timeSignature: '4/4',
        difficulty: 'intermediate',
        tags: ['acoustic', 'fingerpicking'],
        chordData: '{title: Complete}',
        description: 'A complete arrangement',
        createdBy: 'user-123',
        metadata: { isPublic: true, views: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      mockArrangementService.createArrangement.mockResolvedValue(mockArrangement)

      const { result } = renderHook(() => useArrangementMutations())

      const formData: ArrangementFormData = {
        name: 'Complete Arrangement',
        slug: 'complete-arrangement',
        songIds: ['song-123'],
        key: 'C',
        tempo: 120,
        timeSignature: '4/4',
        difficulty: 'intermediate',
        tags: ['acoustic', 'fingerpicking'],
        chordProText: '{title: Complete}',
        description: 'A complete arrangement',
        notes: 'Some notes',
        capo: 2,
        duration: 240
      }

      await act(async () => {
        await result.current.createArrangement(formData)
      })

      expect(mockArrangementService.createArrangement).toHaveBeenCalledWith(formData)
    })
  })
})