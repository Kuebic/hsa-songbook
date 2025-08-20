import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSetlists, useSetlist } from '../useSetlists'
import { mockUseAuth } from '@shared/test-utils/setup'

describe('useSetlists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('when user is not signed in', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        userId: null,
        sessionId: null,
        getToken: vi.fn(),
      })
    })

    it('loads only public setlists', async () => {
      const testSetlists = [
        {
          id: '1',
          name: 'Public Setlist',
          arrangements: [],
          likes: 0,
          likedBy: [],
          allowDuplication: true,
          isPublic: true,
          createdBy: 'user_other',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Private Setlist',
          arrangements: [],
          likes: 0,
          likedBy: [],
          allowDuplication: true,
          isPublic: false,
          createdBy: 'user_other',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      
      localStorage.setItem('hsa-songbook-setlists', JSON.stringify(testSetlists))

      const { result } = renderHook(() => useSetlists())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.setlists).toHaveLength(1)
      expect(result.current.setlists[0].name).toBe('Public Setlist')
    })

    it('throws error when trying to create setlist', () => {
      const { result } = renderHook(() => useSetlists())

      expect(() => {
        result.current.createSetlist('New Setlist')
      }).toThrow('You must be signed in to create a setlist')
    })
  })

  describe('when user is signed in', () => {
    const userId = 'user_123'

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId,
        sessionId: 'session_456',
        getToken: vi.fn(),
      })
    })

    it('loads user setlists and public setlists', async () => {
      const testSetlists = [
        {
          id: '1',
          name: 'My Setlist',
          arrangements: [],
          likes: 0,
          likedBy: [],
          allowDuplication: true,
          isPublic: false,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Public Setlist',
          arrangements: [],
          likes: 0,
          likedBy: [],
          allowDuplication: true,
          isPublic: true,
          createdBy: 'user_other',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          name: 'Other Private',
          arrangements: [],
          likes: 0,
          likedBy: [],
          allowDuplication: true,
          isPublic: false,
          createdBy: 'user_other',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      
      localStorage.setItem('hsa-songbook-setlists', JSON.stringify(testSetlists))

      const { result } = renderHook(() => useSetlists())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.setlists).toHaveLength(2)
      expect(result.current.setlists.map(s => s.name)).toContain('My Setlist')
      expect(result.current.setlists.map(s => s.name)).toContain('Public Setlist')
      expect(result.current.setlists.map(s => s.name)).not.toContain('Other Private')
    })

    it('creates setlist with user association', () => {
      const { result } = renderHook(() => useSetlists())

      act(() => {
        const newSetlist = result.current.createSetlist('New Setlist', 'Description')
        
        expect(newSetlist.name).toBe('New Setlist')
        expect(newSetlist.description).toBe('Description')
        expect(newSetlist.createdBy).toBe(userId)
        expect(newSetlist.isPublic).toBe(false)
        expect(newSetlist.arrangements).toEqual([])
      })

      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it('allows updating own setlist', () => {
      const testSetlist = {
        id: '1',
        name: 'My Setlist',
        arrangements: [],
        isPublic: false,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      localStorage.setItem('hsa-songbook-setlists', JSON.stringify([testSetlist]))

      const { result } = renderHook(() => useSetlists())

      act(() => {
        result.current.updateSetlist('1', { name: 'Updated Name' })
      })

      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it('allows updating other user setlist in development mode', async () => {
      const testSetlist = {
        id: '1',
        name: 'Other User Setlist',
        arrangements: [],
        isPublic: true,
        createdBy: 'user_other',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      localStorage.setItem('hsa-songbook-setlists', JSON.stringify([testSetlist]))

      const { result } = renderHook(() => useSetlists())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should not throw error in development mode (error checking is commented out)
      expect(() => {
        result.current.updateSetlist('1', { name: 'Updated' })
      }).not.toThrow()
    })

    it('allows deleting own setlist', async () => {
      const testSetlist = {
        id: '1',
        name: 'My Setlist',
        arrangements: [],
        isPublic: false,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      localStorage.setItem('hsa-songbook-setlists', JSON.stringify([testSetlist]))

      const { result } = renderHook(() => useSetlists())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.deleteSetlist('1')
      })

      expect(result.current.setlists).toHaveLength(0)
      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it('allows deleting other user setlist in development mode', async () => {
      const testSetlist = {
        id: '1',
        name: 'Other User Setlist',
        arrangements: [],
        isPublic: true,
        createdBy: 'user_other',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      localStorage.setItem('hsa-songbook-setlists', JSON.stringify([testSetlist]))

      const { result } = renderHook(() => useSetlists())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should not throw error in development mode (error checking is commented out)
      expect(() => {
        result.current.deleteSetlist('1')
      }).not.toThrow()
    })

    it('adds song to setlist', async () => {
      const testSetlist = {
        id: '1',
        name: 'My Setlist',
        arrangements: [],
        isPublic: false,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      localStorage.setItem('hsa-songbook-setlists', JSON.stringify([testSetlist]))

      const { result } = renderHook(() => useSetlists())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const mockArrangement = {
        id: 'arr_1',
        name: 'Amazing Grace Arrangement',
        slug: 'amazing-grace-arr',
        songIds: ['song_1'],
        key: 'G',
        difficulty: 'beginner' as const,
        tags: [],
        createdBy: userId,
      }

      act(() => {
        result.current.addArrangementToSetlist('1', mockArrangement, 'Key of G')
      })

      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })
})

describe('useSetlist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('loads specific setlist by id', async () => {
    const testSetlist = {
      id: '1',
      name: 'Test Setlist',
      songs: [],
      isPublic: true,
      createdBy: 'user_123',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    localStorage.setItem('hsa-songbook-setlists', JSON.stringify([testSetlist]))
    
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      getToken: vi.fn(),
    })

    const { result } = renderHook(() => useSetlist('1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.setlist).toBeTruthy()
    expect(result.current.setlist?.name).toBe('Test Setlist')
  })

  it('returns null for non-existent setlist', async () => {
    localStorage.setItem('hsa-songbook-setlists', JSON.stringify([]))
    
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      getToken: vi.fn(),
    })

    const { result } = renderHook(() => useSetlist('non-existent'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.setlist).toBeNull()
  })
})