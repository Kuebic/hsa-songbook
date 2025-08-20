import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSongManagementModal } from '../useSongManagementModal'
import type { Song } from '../../types/song.types'

describe('useSongManagementModal', () => {
  it('should initialize with closed modal and no selected song', () => {
    const { result } = renderHook(() => useSongManagementModal())
    
    expect(result.current.isOpen).toBe(false)
    expect(result.current.selectedSong).toBeUndefined()
  })

  it('should open modal without song for creation', () => {
    const { result } = renderHook(() => useSongManagementModal())
    
    act(() => {
      result.current.openModal()
    })
    
    expect(result.current.isOpen).toBe(true)
    expect(result.current.selectedSong).toBeUndefined()
  })

  it('should open modal with song for editing', () => {
    const { result } = renderHook(() => useSongManagementModal())
    const testSong: Song = {
      id: 'song-123',
      title: 'Test Song',
      artist: 'Test Artist',
      slug: 'test-song',
      themes: ['theme1'],
      metadata: {
        isPublic: false,
        views: 0
      }
    }
    
    act(() => {
      result.current.openModal(testSong)
    })
    
    expect(result.current.isOpen).toBe(true)
    expect(result.current.selectedSong).toEqual(testSong)
  })

  it('should close modal and clear selected song', async () => {
    const { result } = renderHook(() => useSongManagementModal())
    const testSong: Song = {
      id: 'song-123',
      title: 'Test Song',
      artist: 'Test Artist',
      slug: 'test-song',
      themes: ['theme1'],
      metadata: {
        isPublic: false,
        views: 0
      }
    }
    
    // Open modal with song
    act(() => {
      result.current.openModal(testSong)
    })
    
    expect(result.current.isOpen).toBe(true)
    expect(result.current.selectedSong).toEqual(testSong)
    
    // Close modal
    act(() => {
      result.current.closeModal()
    })
    
    expect(result.current.isOpen).toBe(false)
    
    // Wait for cleanup timeout
    await new Promise(resolve => setTimeout(resolve, 250))
    
    expect(result.current.selectedSong).toBeUndefined()
  })

  it('should open create modal specifically', () => {
    const { result } = renderHook(() => useSongManagementModal())
    
    act(() => {
      result.current.openCreateModal()
    })
    
    expect(result.current.isOpen).toBe(true)
    expect(result.current.selectedSong).toBeUndefined()
  })

  it('should open edit modal with specific song', () => {
    const { result } = renderHook(() => useSongManagementModal())
    const testSong: Song = {
      id: 'song-456',
      title: 'Another Song',
      artist: 'Another Artist',
      slug: 'another-song',
      themes: ['theme2'],
      metadata: {
        isPublic: true,
        views: 10
      }
    }
    
    act(() => {
      result.current.openEditModal(testSong)
    })
    
    expect(result.current.isOpen).toBe(true)
    expect(result.current.selectedSong).toEqual(testSong)
  })

  it('should handle multiple open/close cycles correctly', () => {
    const { result } = renderHook(() => useSongManagementModal())
    const song1: Song = {
      id: 'song-1',
      title: 'Song 1',
      artist: 'Artist 1',
      slug: 'song-1',
      themes: ['theme1'],
      metadata: {
        isPublic: false,
        views: 0
      }
    }
    const song2: Song = {
      id: 'song-2',
      title: 'Song 2',
      artist: 'Artist 2',
      slug: 'song-2',
      themes: ['theme2'],
      metadata: {
        isPublic: false,
        views: 0
      }
    }
    
    // First cycle - edit song1
    act(() => {
      result.current.openEditModal(song1)
    })
    expect(result.current.selectedSong).toEqual(song1)
    
    act(() => {
      result.current.closeModal()
    })
    expect(result.current.isOpen).toBe(false)
    
    // Second cycle - create new
    act(() => {
      result.current.openCreateModal()
    })
    expect(result.current.isOpen).toBe(true)
    expect(result.current.selectedSong).toBeUndefined()
    
    act(() => {
      result.current.closeModal()
    })
    expect(result.current.isOpen).toBe(false)
    
    // Third cycle - edit song2
    act(() => {
      result.current.openEditModal(song2)
    })
    expect(result.current.selectedSong).toEqual(song2)
  })
})