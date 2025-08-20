import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSongMutations } from '../mutations/useSongMutations'
import { songService } from '../../services/songService'
import type { Song } from '../../types/song.types'
import type { SongFormData } from '../../validation/schemas/songFormSchema'

// Mock dependencies with factory functions
vi.mock('../../services/songService', () => ({
  songService: {
    createSong: vi.fn(),
    updateSong: vi.fn(),
    deleteSong: vi.fn(),
    rateSong: vi.fn()
  }
}))

vi.mock('@features/auth', () => ({
  useAuth: vi.fn()
}))

vi.mock('../utils/offlineQueue', () => ({
  offlineQueue: {
    add: vi.fn()
  }
}))

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

describe('useSongMutations (Enhanced)', () => {
  const mockSong: Song = {
    id: '123',
    title: 'Test Song',
    artist: 'Test Artist',
    slug: 'test-song',
    themes: ['test'],
    metadata: {
      createdBy: 'test-user-id',
      lastModifiedBy: 'test-user-id',
      isPublic: false,
      ratings: { average: 0, count: 0 },
      views: 0
    }
  }
  
  const mockFormData: SongFormData = {
    title: 'Test Song',
    artist: 'Test Artist',
    themes: ['test'],
    compositionYear: undefined,
    ccli: undefined,
    notes: undefined,
    isPublic: false
  }
  
  let mockCreateSong: any
  let mockUpdateSong: any
  let mockDeleteSong: any
  let mockRateSong: any
  let mockGetToken: any
  let mockOfflineQueueAdd: any
  
  beforeEach(async () => {
    const { useAuth } = await import('@features/auth')
    const { songService } = await import('../../services/songService')
    const { offlineQueue } = await import('../utils/offlineQueue')
    
    mockCreateSong = vi.fn()
    mockUpdateSong = vi.fn()
    mockDeleteSong = vi.fn()
    mockRateSong = vi.fn()
    mockGetToken = vi.fn(() => Promise.resolve('test-token'))
    mockOfflineQueueAdd = vi.fn()
    
    // Set up auth mock
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user-id' },
      userId: 'test-user-id',
      isSignedIn: true,
      getToken: mockGetToken
    })
    
    // Set up service mocks
    songService.createSong = mockCreateSong
    songService.updateSong = mockUpdateSong
    songService.deleteSong = mockDeleteSong
    songService.rateSong = mockRateSong
    
    // Set up offline queue mock
    offlineQueue.add = mockOfflineQueueAdd
    
    Object.defineProperty(navigator, 'onLine', { value: true })
  })
  
  afterEach(() => {
    // Reset navigator.onLine to default
    Object.defineProperty(navigator, 'onLine', { value: true })
  })
  
  describe('createSong', () => {
    it('creates song successfully when online', async () => {
      mockCreateSong.mockResolvedValue(mockSong)
      
      const { result } = renderHook(() => useSongMutations())
      
      let createdSong: Song
      await act(async () => {
        createdSong = await result.current.createSong(mockFormData)
      })
      
      expect(createdSong!).toEqual(mockSong)
      expect(result.current.isCreating).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockCreateSong).toHaveBeenCalledWith(mockFormData, 'test-token')
    })
    
    it('handles creation error and reverts optimistic update', async () => {
      const mockError = new Error('Creation failed')
      mockCreateSong.mockRejectedValue(mockError)
      
      const { result } = renderHook(() => useSongMutations())
      
      await expect(async () => {
        await act(async () => {
          await result.current.createSong(mockFormData)
        })
      }).rejects.toThrow('Creation failed')
      
      expect(result.current.error).toEqual(mockError)
      expect(result.current.isCreating).toBe(false)
    })
    
    it('queues creation when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false })
      
      const { result } = renderHook(() => useSongMutations())
      
      let createdSong: Song
      await act(async () => {
        createdSong = await result.current.createSong(mockFormData)
      })
      
      // Should not call service when offline
      expect(mockCreateSong).not.toHaveBeenCalled()
      
      // Should add to offline queue
      expect(mockOfflineQueueAdd).toHaveBeenCalledWith({
        type: 'create',
        data: { formData: mockFormData, token: 'test-token' }
      })
      
      // Should return optimistic song
      expect(createdSong!.id).toMatch(/^temp-/)
      expect(createdSong!.title).toBe(mockFormData.title)
    })
  })
  
  describe('updateSong', () => {
    const initialSongs = [mockSong]
    
    it('updates song successfully when online', async () => {
      const updatedSong = { ...mockSong, title: 'Updated Song' }
      mockUpdateSong.mockResolvedValue(updatedSong)
      
      const { result } = renderHook(() => useSongMutations({ initialSongs }))
      
      let resultSong: Song
      await act(async () => {
        resultSong = await result.current.updateSong('123', { title: 'Updated Song' })
      })
      
      expect(resultSong!).toEqual(updatedSong)
      expect(result.current.isUpdating).toBe(false)
      expect(mockUpdateSong).toHaveBeenCalledWith('123', { title: 'Updated Song' }, 'test-token', 'test-user-id')
    })
    
    it('handles update error and reverts optimistic update', async () => {
      const mockError = new Error('Update failed')
      mockUpdateSong.mockRejectedValue(mockError)
      
      const { result } = renderHook(() => useSongMutations({ initialSongs }))
      
      await expect(async () => {
        await act(async () => {
          await result.current.updateSong('123', { title: 'Updated Song' })
        })
      }).rejects.toThrow('Update failed')
      
      expect(result.current.error).toEqual(mockError)
    })
  })
  
  describe('deleteSong', () => {
    const initialSongs = [mockSong]
    
    it('deletes song successfully when online', async () => {
      mockDeleteSong.mockResolvedValue(undefined)
      
      const { result } = renderHook(() => useSongMutations({ initialSongs }))
      
      await act(async () => {
        await result.current.deleteSong('123')
      })
      
      expect(mockDeleteSong).toHaveBeenCalledWith('123', 'test-token')
      expect(result.current.isDeleting).toBe(false)
    })
    
    it('handles delete error and reverts optimistic delete', async () => {
      const mockError = new Error('Delete failed')
      mockDeleteSong.mockRejectedValue(mockError)
      
      const { result } = renderHook(() => useSongMutations({ initialSongs }))
      
      await expect(async () => {
        await act(async () => {
          await result.current.deleteSong('123')
        })
      }).rejects.toThrow('Delete failed')
      
      expect(result.current.error).toEqual(mockError)
    })
  })
  
  describe('rateSong', () => {
    const initialSongs = [mockSong]
    
    it('rates song successfully when online', async () => {
      mockRateSong.mockResolvedValue(mockSong)
      
      const { result } = renderHook(() => useSongMutations({ initialSongs }))
      
      await act(async () => {
        await result.current.rateSong('123', 5)
      })
      
      expect(mockRateSong).toHaveBeenCalledWith('123', 5, 'test-token')
      expect(result.current.isRating).toBe(false)
    })
    
    it('validates rating range', async () => {
      const { result } = renderHook(() => useSongMutations({ initialSongs }))
      
      await expect(async () => {
        await act(async () => {
          await result.current.rateSong('123', 6)
        })
      }).rejects.toThrow('Rating must be between 1 and 5')
      
      await expect(async () => {
        await act(async () => {
          await result.current.rateSong('123', 0)
        })
      }).rejects.toThrow('Rating must be between 1 and 5')
    })
  })
  
  describe('optimistic updates', () => {
    it('provides optimistic songs for display', () => {
      const initialSongs = [mockSong]
      const { result } = renderHook(() => useSongMutations({ initialSongs }))
      
      expect(result.current.optimisticSongs).toEqual(initialSongs)
    })
    
    it('calls onSongsUpdate when optimistic state changes', async () => {
      const onSongsUpdate = vi.fn()
      const initialSongs = [mockSong]
      
      mockCreateSong.mockResolvedValue({
        ...mockSong,
        id: 'real-id'
      })
      
      const { result } = renderHook(() => useSongMutations({ 
        initialSongs, 
        onSongsUpdate 
      }))
      
      await act(async () => {
        await result.current.createSong(mockFormData)
      })
      
      // Should be called multiple times during optimistic updates
      expect(onSongsUpdate).toHaveBeenCalled()
    })
  })
  
  describe('error handling', () => {
    it('provides error state and clearError method', async () => {
      const mockError = new Error('Test error')
      mockCreateSong.mockRejectedValue(mockError)
      
      const { result } = renderHook(() => useSongMutations())
      
      await expect(async () => {
        await act(async () => {
          await result.current.createSong(mockFormData)
        })
      }).rejects.toThrow('Test error')
      
      expect(result.current.error).toEqual(mockError)
      
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.error).toBeNull()
    })
  })
  
  describe('legacy methods', () => {
    const initialSongs = [mockSong]
    
    it('provides updateSongTitle method for backward compatibility', async () => {
      const updatedSong = { ...mockSong, title: 'New Title' }
      vi.mocked(songService.updateSong).mockResolvedValue(updatedSong)
      
      const { result } = renderHook(() => useSongMutations({ initialSongs }))
      
      await act(async () => {
        await result.current.updateSongTitle('123', 'New Title')
      })
      
      expect(mockUpdateSong).toHaveBeenCalledWith('123', { title: 'New Title' }, 'test-token', 'test-user-id')
    })
    
    it('provides updateSongField method for backward compatibility', async () => {
      const updatedSong = { ...mockSong, artist: 'New Artist' }
      vi.mocked(songService.updateSong).mockResolvedValue(updatedSong)
      
      const { result } = renderHook(() => useSongMutations({ initialSongs }))
      
      await act(async () => {
        await result.current.updateSongField('123', 'artist', 'New Artist')
      })
      
      expect(mockUpdateSong).toHaveBeenCalledWith('123', { artist: 'New Artist' }, 'test-token', 'test-user-id')
    })
  })
})