# Song API Integration & Mutations Implementation PRP

## Executive Summary
Create comprehensive mutation hooks for song CRUD operations, implementing optimistic updates for better UX and offline queue support for PWA functionality. This integrates with the existing songService and provides a clean API for form components.

**Confidence Score: 9/10** - High confidence due to existing service infrastructure and clear patterns.

## Context and Research Findings

### Current State Analysis
**Existing Infrastructure:**
- Complete `songService` with all CRUD methods in `src/features/songs/services/songService.ts`
- Authentication integration with Clerk
- Caching and retry logic already implemented
- Some mutation hooks exist (`useSongMutations`) but incomplete

**API Endpoints Available:**
- `GET /api/v1/songs` - List all songs
- `GET /api/v1/songs/:id` - Get single song
- `POST /api/v1/songs` - Create new song
- `PATCH /api/v1/songs/:id` - Update song
- `DELETE /api/v1/songs/:id` - Delete song
- `POST /api/v1/songs/:id/rate` - Rate song

**Missing Functionality:**
- Optimistic updates for immediate UI feedback
- Offline queue for PWA support
- Proper cache invalidation
- Error recovery strategies
- Loading states management

### React 19 Features to Leverage
- `useOptimistic` - For optimistic UI updates
- `useTransition` - For non-blocking updates
- `startTransition` - For deferred updates
- Server Actions preparation

### Vertical Slice Architecture
```
src/features/songs/hooks/
├── mutations/
│   ├── useSongMutations.ts      # Main mutations hook
│   ├── useCreateSong.ts         # Create mutation
│   ├── useUpdateSong.ts         # Update mutation
│   ├── useDeleteSong.ts         # Delete mutation
│   └── useRateSong.ts           # Rating mutation
├── utils/
│   ├── offlineQueue.ts          # Offline queue management
│   ├── optimisticUpdates.ts     # Optimistic update helpers
│   └── cacheInvalidation.ts     # Cache management
└── __tests__/
    ├── useSongMutations.test.ts
    └── offlineQueue.test.ts
```

## Implementation Blueprint

### Phase 1: Offline Queue Infrastructure

```typescript
// src/features/songs/hooks/utils/offlineQueue.ts
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'

export interface QueuedAction {
  id: string
  type: 'create' | 'update' | 'delete' | 'rate'
  data: any
  timestamp: number
  retries: number
  maxRetries: number
}

export interface OfflineQueueOptions {
  storageKey?: string
  maxRetries?: number
  retryDelay?: number
  onSync?: (action: QueuedAction) => void
  onError?: (action: QueuedAction, error: Error) => void
}

class OfflineQueue {
  private queue: Map<string, QueuedAction> = new Map()
  private storageKey: string
  private maxRetries: number
  private retryDelay: number
  private isOnline: boolean = navigator.onLine
  private syncInProgress: boolean = false
  private onSync?: (action: QueuedAction) => void
  private onError?: (action: QueuedAction, error: Error) => void
  
  constructor(options: OfflineQueueOptions = {}) {
    this.storageKey = options.storageKey || 'songOfflineQueue'
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 1000
    this.onSync = options.onSync
    this.onError = options.onError
    
    this.loadQueue()
    this.setupEventListeners()
    
    // Try to sync on initialization if online
    if (this.isOnline) {
      this.processQueue()
    }
  }
  
  private loadQueue() {
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved) {
        const items = JSON.parse(saved) as QueuedAction[]
        items.forEach(item => {
          this.queue.set(item.id, item)
        })
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error)
    }
  }
  
  private saveQueue() {
    try {
      const items = Array.from(this.queue.values())
      localStorage.setItem(this.storageKey, JSON.stringify(items))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }
  
  private setupEventListeners() {
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
    
    // Also listen for visibility change to sync when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processQueue()
      }
    })
  }
  
  private handleOnline = () => {
    this.isOnline = true
    console.log('Network connection restored, processing offline queue...')
    this.processQueue()
  }
  
  private handleOffline = () => {
    this.isOnline = false
    console.log('Network connection lost, queuing actions...')
  }
  
  add(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries' | 'maxRetries'>): string {
    const id = `${action.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const queuedAction: QueuedAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: this.maxRetries
    }
    
    this.queue.set(id, queuedAction)
    this.saveQueue()
    
    // Try to process immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.processQueue()
    }
    
    return id
  }
  
  remove(id: string) {
    this.queue.delete(id)
    this.saveQueue()
  }
  
  async processQueue() {
    if (!this.isOnline || this.syncInProgress || this.queue.size === 0) {
      return
    }
    
    this.syncInProgress = true
    
    // Sort by timestamp to process in order
    const sortedActions = Array.from(this.queue.values())
      .sort((a, b) => a.timestamp - b.timestamp)
    
    for (const action of sortedActions) {
      try {
        await this.processAction(action)
        this.remove(action.id)
        this.onSync?.(action)
      } catch (error) {
        console.error(`Failed to process action ${action.id}:`, error)
        
        action.retries++
        
        if (action.retries >= action.maxRetries) {
          console.error(`Max retries reached for action ${action.id}, removing from queue`)
          this.remove(action.id)
          this.onError?.(action, error as Error)
        } else {
          // Update retry count and wait before next attempt
          this.queue.set(action.id, action)
          this.saveQueue()
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * action.retries))
        }
      }
    }
    
    this.syncInProgress = false
  }
  
  private async processAction(action: QueuedAction): Promise<void> {
    // Import dynamically to avoid circular dependencies
    const { songService } = await import('@features/songs/services/songService')
    
    switch (action.type) {
      case 'create':
        await songService.createSong(action.data.formData, action.data.token)
        break
      case 'update':
        await songService.updateSong(action.data.id, action.data.formData, action.data.token)
        break
      case 'delete':
        await songService.deleteSong(action.data.id, action.data.token)
        break
      case 'rate':
        await songService.rateSong(action.data.id, action.data.rating, action.data.token)
        break
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }
  
  getQueueSize(): number {
    return this.queue.size
  }
  
  getQueuedActions(): QueuedAction[] {
    return Array.from(this.queue.values())
  }
  
  clearQueue() {
    this.queue.clear()
    this.saveQueue()
  }
  
  destroy() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    this.clearQueue()
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue({
  onSync: (action) => {
    console.log('Synced offline action:', action.type, action.id)
  },
  onError: (action, error) => {
    console.error('Failed to sync action:', action.type, error)
    // Could show user notification here
  }
})
```

### Phase 2: Optimistic Update Helpers

```typescript
// src/features/songs/hooks/utils/optimisticUpdates.ts
import type { Song } from '@features/songs/types/song.types'
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'
import { generateUniqueSlug } from '@features/songs/validation/utils/slugGeneration'

export function createOptimisticSong(
  formData: SongFormData,
  userId: string
): Song {
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const slug = `temp-${formData.title.toLowerCase().replace(/\s+/g, '-')}`
  
  return {
    id: tempId,
    _id: tempId, // MongoDB compatibility
    title: formData.title,
    artist: formData.artist || '',
    slug,
    compositionYear: formData.compositionYear,
    ccli: formData.ccli,
    themes: formData.themes,
    source: formData.source,
    notes: formData.notes,
    metadata: {
      createdBy: userId,
      lastModifiedBy: userId,
      isPublic: formData.isPublic || false,
      ratings: { average: 0, count: 0 },
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
}

export function updateOptimisticSong(
  existing: Song,
  updates: Partial<SongFormData>
): Song {
  return {
    ...existing,
    ...updates,
    metadata: {
      ...existing.metadata,
      lastModifiedBy: 'current-user',
      updatedAt: new Date().toISOString()
    }
  }
}

export function isOptimisticSong(song: Song): boolean {
  return song.id.startsWith('temp-')
}

export function replaceOptimisticSong(
  songs: Song[],
  tempId: string,
  realSong: Song
): Song[] {
  return songs.map(song => 
    song.id === tempId ? realSong : song
  )
}

export function removeOptimisticSong(
  songs: Song[],
  tempId: string
): Song[] {
  return songs.filter(song => song.id !== tempId)
}
```

### Phase 3: Main Mutations Hook

```typescript
// src/features/songs/hooks/mutations/useSongMutations.ts
import { useState, useCallback, useOptimistic, useTransition } from 'react'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useSongs } from '@features/songs/hooks/useSongs'
import { songService } from '@features/songs/services/songService'
import { offlineQueue } from '../utils/offlineQueue'
import {
  createOptimisticSong,
  updateOptimisticSong,
  replaceOptimisticSong,
  removeOptimisticSong
} from '../utils/optimisticUpdates'
import type { Song } from '@features/songs/types/song.types'
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'

export interface UseSongMutationsReturn {
  createSong: (data: SongFormData) => Promise<Song>
  updateSong: (id: string, data: Partial<SongFormData>) => Promise<Song>
  deleteSong: (id: string) => Promise<void>
  rateSong: (id: string, rating: number) => Promise<void>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isRating: boolean
  error: Error | null
  clearError: () => void
}

export function useSongMutations(): UseSongMutationsReturn {
  const { getToken, user } = useAuth()
  const { songs, setSongs, invalidateCache } = useSongs()
  const [isPending, startTransition] = useTransition()
  
  const [optimisticSongs, addOptimisticUpdate] = useOptimistic(
    songs,
    (state: Song[], update: { type: string; payload: any }) => {
      switch (update.type) {
        case 'create':
          return [...state, update.payload]
        case 'update':
          return state.map(song =>
            song.id === update.payload.id
              ? updateOptimisticSong(song, update.payload.data)
              : song
          )
        case 'delete':
          return state.filter(song => song.id !== update.payload)
        case 'rate':
          return state.map(song =>
            song.id === update.payload.id
              ? {
                  ...song,
                  metadata: {
                    ...song.metadata,
                    ratings: {
                      ...song.metadata.ratings,
                      average: update.payload.rating
                    }
                  }
                }
              : song
          )
        default:
          return state
      }
    }
  )
  
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRating, setIsRating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  const createSong = useCallback(async (formData: SongFormData): Promise<Song> => {
    if (!user) {
      throw new Error('Authentication required')
    }
    
    setIsCreating(true)
    setError(null)
    
    // Create optimistic song
    const optimisticSong = createOptimisticSong(formData, user.id)
    
    // Add optimistic update immediately
    startTransition(() => {
      addOptimisticUpdate({ type: 'create', payload: optimisticSong })
    })
    
    try {
      const token = await getToken()
      
      if (!navigator.onLine) {
        // Queue for offline processing
        offlineQueue.add({
          type: 'create',
          data: { formData, token }
        })
        
        // Return optimistic song for now
        return optimisticSong
      }
      
      // Make API call
      const newSong = await songService.createSong(formData, token)
      
      // Replace optimistic song with real one
      startTransition(() => {
        setSongs(prev => replaceOptimisticSong(prev, optimisticSong.id, newSong))
      })
      
      // Invalidate cache to fetch fresh data
      invalidateCache()
      
      return newSong
    } catch (err) {
      // Remove optimistic song on error
      startTransition(() => {
        setSongs(prev => removeOptimisticSong(prev, optimisticSong.id))
      })
      
      const error = err instanceof Error ? err : new Error('Failed to create song')
      setError(error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [user, getToken, addOptimisticUpdate, setSongs, invalidateCache])
  
  const updateSong = useCallback(async (
    id: string,
    updates: Partial<SongFormData>
  ): Promise<Song> => {
    if (!user) {
      throw new Error('Authentication required')
    }
    
    setIsUpdating(true)
    setError(null)
    
    // Find existing song
    const existingSong = songs.find(s => s.id === id)
    if (!existingSong) {
      throw new Error('Song not found')
    }
    
    // Apply optimistic update
    startTransition(() => {
      addOptimisticUpdate({ type: 'update', payload: { id, data: updates } })
    })
    
    try {
      const token = await getToken()
      
      if (!navigator.onLine) {
        // Queue for offline processing
        offlineQueue.add({
          type: 'update',
          data: { id, formData: updates, token }
        })
        
        // Return optimistically updated song
        return updateOptimisticSong(existingSong, updates)
      }
      
      // Make API call
      const updatedSong = await songService.updateSong(id, updates, token)
      
      // Update with real data
      startTransition(() => {
        setSongs(prev => prev.map(song =>
          song.id === id ? updatedSong : song
        ))
      })
      
      invalidateCache()
      
      return updatedSong
    } catch (err) {
      // Revert optimistic update on error
      startTransition(() => {
        setSongs(prev => prev.map(song =>
          song.id === id ? existingSong : song
        ))
      })
      
      const error = err instanceof Error ? err : new Error('Failed to update song')
      setError(error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [user, songs, getToken, addOptimisticUpdate, setSongs, invalidateCache])
  
  const deleteSong = useCallback(async (id: string): Promise<void> => {
    if (!user) {
      throw new Error('Authentication required')
    }
    
    setIsDeleting(true)
    setError(null)
    
    // Find song to delete
    const songToDelete = songs.find(s => s.id === id)
    if (!songToDelete) {
      throw new Error('Song not found')
    }
    
    // Apply optimistic delete
    startTransition(() => {
      addOptimisticUpdate({ type: 'delete', payload: id })
    })
    
    try {
      const token = await getToken()
      
      if (!navigator.onLine) {
        // Queue for offline processing
        offlineQueue.add({
          type: 'delete',
          data: { id, token }
        })
        return
      }
      
      // Make API call
      await songService.deleteSong(id, token)
      
      // Confirm deletion
      startTransition(() => {
        setSongs(prev => prev.filter(song => song.id !== id))
      })
      
      invalidateCache()
    } catch (err) {
      // Revert optimistic delete on error
      startTransition(() => {
        setSongs(prev => {
          // Re-add the song if it was deleted
          if (!prev.find(s => s.id === id)) {
            return [...prev, songToDelete]
          }
          return prev
        })
      })
      
      const error = err instanceof Error ? err : new Error('Failed to delete song')
      setError(error)
      throw error
    } finally {
      setIsDeleting(false)
    }
  }, [user, songs, getToken, addOptimisticUpdate, setSongs, invalidateCache])
  
  const rateSong = useCallback(async (id: string, rating: number): Promise<void> => {
    if (!user) {
      throw new Error('Authentication required')
    }
    
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }
    
    setIsRating(true)
    setError(null)
    
    // Find song to rate
    const song = songs.find(s => s.id === id)
    if (!song) {
      throw new Error('Song not found')
    }
    
    const previousRating = song.metadata.ratings?.average || 0
    
    // Apply optimistic rating update
    startTransition(() => {
      addOptimisticUpdate({ type: 'rate', payload: { id, rating } })
    })
    
    try {
      const token = await getToken()
      
      if (!navigator.onLine) {
        // Queue for offline processing
        offlineQueue.add({
          type: 'rate',
          data: { id, rating, token }
        })
        return
      }
      
      // Make API call
      await songService.rateSong(id, rating, token)
      
      // Refresh to get updated rating data
      invalidateCache()
    } catch (err) {
      // Revert optimistic rating on error
      startTransition(() => {
        setSongs(prev => prev.map(s =>
          s.id === id
            ? {
                ...s,
                metadata: {
                  ...s.metadata,
                  ratings: {
                    ...s.metadata.ratings,
                    average: previousRating
                  }
                }
              }
            : s
        ))
      })
      
      const error = err instanceof Error ? err : new Error('Failed to rate song')
      setError(error)
      throw error
    } finally {
      setIsRating(false)
    }
  }, [user, songs, getToken, addOptimisticUpdate, setSongs, invalidateCache])
  
  return {
    createSong,
    updateSong,
    deleteSong,
    rateSong,
    isCreating,
    isUpdating,
    isDeleting,
    isRating,
    error,
    clearError
  }
}
```

### Phase 4: Integration with Form Components

```typescript
// src/features/songs/components/forms/useSongFormSubmit.ts
import { useState, useCallback } from 'react'
import { useSongMutations } from '@features/songs/hooks/mutations/useSongMutations'
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'
import type { Song } from '@features/songs/types/song.types'

interface UseSongFormSubmitOptions {
  onSuccess?: (song: Song) => void
  onError?: (error: Error) => void
}

export function useSongFormSubmit(options: UseSongFormSubmitOptions = {}) {
  const { createSong, updateSong, error, clearError } = useSongMutations()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = useCallback(async (
    data: SongFormData,
    songId?: string
  ) => {
    setIsSubmitting(true)
    clearError()
    
    try {
      let result: Song
      
      if (songId) {
        result = await updateSong(songId, data)
      } else {
        result = await createSong(data)
      }
      
      options.onSuccess?.(result)
      
      // Show success notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Song saved successfully', {
          body: `${result.title} has been ${songId ? 'updated' : 'created'}`,
          icon: '/icon.svg'
        })
      }
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save song')
      options.onError?.(error)
      
      // Show error notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Failed to save song', {
          body: error.message,
          icon: '/icon.svg'
        })
      }
      
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [createSong, updateSong, clearError, options])
  
  return {
    handleSubmit,
    isSubmitting,
    error,
    clearError
  }
}
```

### Phase 5: Comprehensive Tests

```typescript
// src/features/songs/hooks/__tests__/useSongMutations.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSongMutations } from '../mutations/useSongMutations'
import { songService } from '@features/songs/services/songService'

// Mock dependencies
vi.mock('@features/songs/services/songService')
vi.mock('@features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    getToken: () => Promise.resolve('test-token')
  })
}))

describe('useSongMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('createSong', () => {
    it('creates song successfully', async () => {
      const mockSong = {
        id: '123',
        title: 'Test Song',
        themes: ['test']
      }
      
      vi.mocked(songService.createSong).mockResolvedValue(mockSong)
      
      const { result } = renderHook(() => useSongMutations())
      
      let createdSong
      await act(async () => {
        createdSong = await result.current.createSong({
          title: 'Test Song',
          themes: ['test']
        })
      })
      
      expect(createdSong).toEqual(mockSong)
      expect(result.current.isCreating).toBe(false)
      expect(result.current.error).toBeNull()
    })
    
    it('handles creation error', async () => {
      const mockError = new Error('Creation failed')
      vi.mocked(songService.createSong).mockRejectedValue(mockError)
      
      const { result } = renderHook(() => useSongMutations())
      
      await expect(async () => {
        await act(async () => {
          await result.current.createSong({
            title: 'Test Song',
            themes: ['test']
          })
        })
      }).rejects.toThrow('Creation failed')
      
      expect(result.current.error).toEqual(mockError)
    })
    
    it('queues creation when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })
      
      const { result } = renderHook(() => useSongMutations())
      
      await act(async () => {
        await result.current.createSong({
          title: 'Offline Song',
          themes: ['test']
        })
      })
      
      // Should not call service when offline
      expect(songService.createSong).not.toHaveBeenCalled()
      
      // Reset online state
      Object.defineProperty(navigator, 'onLine', {
        value: true
      })
    })
  })
  
  describe('updateSong', () => {
    it('updates song successfully', async () => {
      const mockUpdatedSong = {
        id: '123',
        title: 'Updated Song',
        themes: ['updated']
      }
      
      vi.mocked(songService.updateSong).mockResolvedValue(mockUpdatedSong)
      
      const { result } = renderHook(() => useSongMutations())
      
      let updatedSong
      await act(async () => {
        updatedSong = await result.current.updateSong('123', {
          title: 'Updated Song'
        })
      })
      
      expect(updatedSong).toEqual(mockUpdatedSong)
      expect(result.current.isUpdating).toBe(false)
    })
  })
  
  describe('deleteSong', () => {
    it('deletes song successfully', async () => {
      vi.mocked(songService.deleteSong).mockResolvedValue(undefined)
      
      const { result } = renderHook(() => useSongMutations())
      
      await act(async () => {
        await result.current.deleteSong('123')
      })
      
      expect(songService.deleteSong).toHaveBeenCalledWith('123', 'test-token')
      expect(result.current.isDeleting).toBe(false)
    })
  })
  
  describe('rateSong', () => {
    it('rates song successfully', async () => {
      vi.mocked(songService.rateSong).mockResolvedValue(undefined)
      
      const { result } = renderHook(() => useSongMutations())
      
      await act(async () => {
        await result.current.rateSong('123', 5)
      })
      
      expect(songService.rateSong).toHaveBeenCalledWith('123', 5, 'test-token')
      expect(result.current.isRating).toBe(false)
    })
    
    it('validates rating range', async () => {
      const { result } = renderHook(() => useSongMutations())
      
      await expect(async () => {
        await act(async () => {
          await result.current.rateSong('123', 6)
        })
      }).rejects.toThrow('Rating must be between 1 and 5')
    })
  })
})

// src/features/songs/hooks/__tests__/offlineQueue.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OfflineQueue } from '../utils/offlineQueue'

describe('OfflineQueue', () => {
  let queue: OfflineQueue
  
  beforeEach(() => {
    localStorage.clear()
    queue = new OfflineQueue()
  })
  
  afterEach(() => {
    queue.destroy()
  })
  
  it('adds actions to queue', () => {
    const actionId = queue.add({
      type: 'create',
      data: { title: 'Test' }
    })
    
    expect(actionId).toBeTruthy()
    expect(queue.getQueueSize()).toBe(1)
  })
  
  it('persists queue to localStorage', () => {
    queue.add({
      type: 'create',
      data: { title: 'Test' }
    })
    
    const saved = localStorage.getItem('songOfflineQueue')
    expect(saved).toBeTruthy()
    
    const parsed = JSON.parse(saved!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].type).toBe('create')
  })
  
  it('loads queue from localStorage', () => {
    const actions = [
      { id: '1', type: 'create', data: {}, timestamp: Date.now(), retries: 0, maxRetries: 3 }
    ]
    localStorage.setItem('songOfflineQueue', JSON.stringify(actions))
    
    const newQueue = new OfflineQueue()
    expect(newQueue.getQueueSize()).toBe(1)
    newQueue.destroy()
  })
  
  it('processes queue when online', async () => {
    const mockProcess = vi.fn().mockResolvedValue(undefined)
    queue.processAction = mockProcess
    
    queue.add({
      type: 'create',
      data: { title: 'Test' }
    })
    
    await queue.processQueue()
    
    expect(mockProcess).toHaveBeenCalled()
    expect(queue.getQueueSize()).toBe(0)
  })
})
```

## Validation Gates

### Level 1: Type Checking & Linting
```bash
npm run lint
npm run type-check
```

### Level 2: Unit Tests
```bash
npm run test -- src/features/songs/hooks/
```

### Level 3: Integration Tests
```bash
npm run test -- --coverage src/features/songs/
```

### Level 4: Network Tests
```bash
# Test offline functionality
# 1. Create song while offline
# 2. Go online and verify sync
# 3. Check for duplicate prevention
```

### Level 5: Performance Tests
- [ ] Optimistic updates < 16ms
- [ ] Queue persistence < 50ms
- [ ] API calls properly debounced
- [ ] Memory leaks prevented

## File Creation Order

1. `src/features/songs/hooks/utils/offlineQueue.ts`
2. `src/features/songs/hooks/utils/optimisticUpdates.ts`
3. `src/features/songs/hooks/utils/cacheInvalidation.ts`
4. `src/features/songs/hooks/mutations/useSongMutations.ts`
5. `src/features/songs/components/forms/useSongFormSubmit.ts`
6. Test files for all hooks

## Success Metrics

- ✅ All CRUD operations work online
- ✅ Offline queue functions properly
- ✅ Optimistic updates feel instant
- ✅ Error recovery works
- ✅ Cache invalidation correct
- ✅ No memory leaks
- ✅ PWA fully functional offline
- ✅ < 100ms perceived latency

## Common Pitfalls to Avoid

1. **Race conditions** - Handle rapid mutations properly
2. **Memory leaks** - Clean up event listeners
3. **Stale closures** - Use latest state in callbacks
4. **Network flakiness** - Implement proper retry logic
5. **Queue persistence** - Handle localStorage quota
6. **Optimistic conflicts** - Handle ID mismatches
7. **Auth expiry** - Refresh tokens before mutations

## External Resources

- [React Optimistic Updates](https://react.dev/reference/react/useOptimistic)
- [PWA Offline Strategies](https://web.dev/offline-cookbook/)
- [React Query Patterns](https://tanstack.com/query/latest)
- [IndexedDB for Large Data](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

## Conclusion

This implementation provides robust mutation handling with offline support and optimistic updates, ensuring excellent user experience even in poor network conditions.

**Confidence Score: 9/10** - Comprehensive solution leveraging existing infrastructure with proven patterns.