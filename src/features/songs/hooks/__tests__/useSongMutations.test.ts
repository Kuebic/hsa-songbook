import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSongMutations } from '../useSongMutations'

// Mock auth hook with factory function
vi.mock('@features/auth', () => ({
  useAuth: vi.fn()
}))

// Mock song service with factory function
vi.mock('../../services/songService', () => ({
  songService: {
    updateSong: vi.fn()
  }
}))

describe('useSongMutations', () => {
  let mockGetToken: any
  let mockUpdateSong: any
  
  beforeEach(async () => {
    const { useAuth } = await import('@features/auth')
    const { songService } = await import('../../services/songService')
    
    mockGetToken = vi.fn()
    mockUpdateSong = vi.fn()
    
    vi.mocked(useAuth).mockReturnValue({
      isSignedIn: true,
      isAdmin: false,
      userId: 'user-123',
      getToken: mockGetToken,
      user: null,
      isLoaded: true,
      sessionId: null,
      getUserEmail: () => '',
      getUserName: () => '',
      getUserAvatar: () => ''
    })
    
    songService.updateSong = mockUpdateSong
  })
  
  it('should update song title when authenticated', async () => {
    mockGetToken.mockResolvedValue('test-token')
    mockUpdateSong.mockResolvedValue({
      id: 'song-1',
      title: 'New Title',
      artist: 'Artist',
      slug: 'new-title'
    })
    
    const { result } = renderHook(() => useSongMutations())
    
    const updatedSong = await result.current.updateSongTitle('song-1', 'New Title')
    
    expect(mockGetToken).toHaveBeenCalled()
    expect(mockUpdateSong).toHaveBeenCalledWith('song-1', { title: 'New Title' }, 'test-token', 'user-123')
    expect(updatedSong.title).toBe('New Title')
  })
  
  it('should throw error when not signed in', async () => {
    const { useAuth } = vi.mocked(await import('@features/auth'))
    useAuth.mockReturnValue({
      isSignedIn: false,
      isAdmin: false,
      userId: null,
      getToken: mockGetToken,
      user: null,
      isLoaded: true,
      sessionId: null,
      getUserEmail: () => '',
      getUserName: () => '',
      getUserAvatar: () => ''
    })
    
    const { result } = renderHook(() => useSongMutations())
    
    await expect(
      result.current.updateSongTitle('song-1', 'New Title')
    ).rejects.toThrow('Please sign in to edit songs')
  })
  
  it('should throw error when token is not available', async () => {
    mockGetToken.mockResolvedValue(null)
    
    const { result } = renderHook(() => useSongMutations())
    
    await expect(
      result.current.updateSongTitle('song-1', 'New Title')
    ).rejects.toThrow('Unable to get authentication token')
  })
  
  it('should update any song field', async () => {
    mockGetToken.mockResolvedValue('test-token')
    mockUpdateSong.mockResolvedValue({
      id: 'song-1',
      title: 'Title',
      artist: 'New Artist',
      slug: 'title'
    })
    
    const { result } = renderHook(() => useSongMutations())
    
    const updatedSong = await result.current.updateSongField('song-1', 'artist', 'New Artist')
    
    expect(mockUpdateSong).toHaveBeenCalledWith('song-1', { artist: 'New Artist' }, 'test-token', 'user-123')
    expect(updatedSong.artist).toBe('New Artist')
  })
})