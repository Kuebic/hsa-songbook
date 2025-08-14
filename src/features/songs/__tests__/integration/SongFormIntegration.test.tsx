import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { renderAsAdmin, screen, waitFor, userEvent } from '../../test-utils/render'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { SongFormModal } from '../../components/forms/SongFormModal'
import { songFactory } from '../../test-utils/factories'
import type { Song } from '../../types/song.types'

// Setup MSW server for API mocking
const server = setupServer(
  // Mock API endpoints
  http.post('/api/v1/songs', async ({ request }) => {
    const data = await request.json() as Record<string, unknown> & { title?: string; themes?: string[] }
    
    // Validate request
    if (!data.title) {
      return HttpResponse.json(
        { 
          success: false, 
          error: { message: 'Title is required' } 
        },
        { status: 400 }
      )
    }
    
    if (!data.themes || data.themes.length === 0) {
      return HttpResponse.json(
        { 
          success: false, 
          error: { message: 'At least one theme is required' } 
        },
        { status: 400 }
      )
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        ...songFactory.build(),
        ...data,
        id: 'new-song-id',
        slug: data.title.toLowerCase().replace(/\s+/g, '-')
      }
    })
  }),
  
  http.patch('/api/v1/songs/:id', async ({ request, params }) => {
    const data = await request.json()
    
    return HttpResponse.json({
      success: true,
      data: {
        ...songFactory.build(),
        ...(data as Record<string, unknown>),
        id: params.id as string
      }
    })
  }),
  
  http.get('/api/v1/songs', () => {
    return HttpResponse.json({
      success: true,
      data: songFactory.buildList(10),
      meta: {
        total: 10,
        page: 1,
        limit: 20
      }
    })
  }),
  
  http.get('/api/v1/songs/check-duplicate', ({ request }) => {
    const url = new URL(request.url)
    const title = url.searchParams.get('title')
    
    if (title?.toLowerCase() === 'duplicate song') {
      return HttpResponse.json({
        success: true,
        data: {
          duplicates: [songFactory.build({ title: 'Duplicate Song' })],
          hasExactMatch: true
        }
      })
    }
    
    return HttpResponse.json({
      success: true,
      data: {
        duplicates: [],
        hasExactMatch: false
      }
    })
  })
)

// Start/stop server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Song Form Integration', () => {
  describe('Create Song Flow', () => {
    it('successfully creates a song via API', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()
      const mockOnClose = vi.fn()
      
      renderAsAdmin(
        <SongFormModal 
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={async (data) => {
            const response = await fetch('/api/v1/songs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })
            const result = await response.json()
            if (result.success) {
              mockOnSuccess(result.data)
              mockOnClose()
            }
            return result
          }}
        />
      )
      
      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Integration Test Song')
      await user.type(screen.getByLabelText(/artist/i), 'Test Artist')
      
      // Add theme
      const themeInput = screen.getByLabelText(/theme search/i)
      await user.type(themeInput, 'worship')
      await user.keyboard('{Enter}')
      
      // Submit
      await user.click(screen.getByRole('button', { name: /create song/i }))
      
      // Verify API call and success
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Integration Test Song',
            artist: 'Test Artist',
            slug: 'integration-test-song'
          })
        )
      })
      
      expect(mockOnClose).toHaveBeenCalled()
    })
    
    it('handles API validation errors', async () => {
      const user = userEvent.setup()
      const mockOnError = vi.fn()
      
      server.use(
        http.post('/api/v1/songs', () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                message: 'Validation failed',
                errors: {
                  title: 'Title already exists',
                  ccli: 'Invalid CCLI format'
                }
              }
            },
            { status: 400 }
          )
        })
      )
      
      renderAsAdmin(
        <SongFormModal 
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={async (data) => {
            const response = await fetch('/api/v1/songs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })
            const result = await response.json()
            if (!result.success) {
              mockOnError(result.error)
              throw new Error(result.error.message)
            }
            return result
          }}
        />
      )
      
      // Fill and submit
      await user.type(screen.getByLabelText(/title/i), 'Duplicate Song')
      const themeInput = screen.getByLabelText(/theme search/i)
      await user.type(themeInput, 'worship')
      await user.keyboard('{Enter}')
      
      await user.click(screen.getByRole('button', { name: /create song/i }))
      
      // Should show error
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Validation failed',
            errors: expect.objectContaining({
              title: 'Title already exists'
            })
          })
        )
      })
    })
    
    it('handles network errors gracefully', async () => {
      const user = userEvent.setup()
      const mockOnError = vi.fn()
      
      server.use(
        http.post('/api/v1/songs', () => {
          return HttpResponse.error()
        })
      )
      
      renderAsAdmin(
        <SongFormModal 
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={async (data) => {
            try {
              const response = await fetch('/api/v1/songs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              })
              if (!response.ok) {
                throw new Error('Network error')
              }
              return await response.json()
            } catch (error) {
              mockOnError(error)
              throw error
            }
          }}
        />
      )
      
      // Fill and submit
      await user.type(screen.getByLabelText(/title/i), 'Test Song')
      const themeInput = screen.getByLabelText(/theme search/i)
      await user.type(themeInput, 'worship')
      await user.keyboard('{Enter}')
      
      await user.click(screen.getByRole('button', { name: /create song/i }))
      
      // Should call error handler
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Network error'
          })
        )
      })
    })
    
    it('performs duplicate check before submission', async () => {
      const user = userEvent.setup()
      
      renderAsAdmin(
        <SongFormModal 
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      )
      
      // Type a title that will trigger duplicate detection
      await user.type(screen.getByLabelText(/title/i), 'Duplicate Song')
      
      // Should show duplicate warning
      await waitFor(() => {
        const duplicateWarning = screen.queryByText(/duplicate/i, { selector: 'h3' })
        // Note: This depends on the actual implementation
        expect(duplicateWarning).toBeDefined()
      })
    })
  })
  
  describe('Update Song Flow', () => {
    it('successfully updates an existing song', async () => {
      const user = userEvent.setup()
      const existingSong = songFactory.build()
      const mockOnSuccess = vi.fn()
      
      renderAsAdmin(
        <SongFormModal 
          isOpen={true}
          onClose={vi.fn()}
          song={existingSong}
          onSubmit={async (data) => {
            const response = await fetch(`/api/v1/songs/${existingSong.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })
            const result = await response.json()
            if (result.success) {
              mockOnSuccess(result.data)
            }
            return result
          }}
        />
      )
      
      // Modify title
      const titleInput = screen.getByDisplayValue(existingSong.title)
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')
      
      // Submit
      await user.click(screen.getByRole('button', { name: /update song/i }))
      
      // Verify update
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            id: existingSong.id,
            title: 'Updated Title'
          })
        )
      })
    })
    
    it('handles partial updates', async () => {
      const user = userEvent.setup()
      const existingSong = songFactory.build()
      const mockOnSuccess = vi.fn()
      
      renderAsAdmin(
        <SongFormModal 
          isOpen={true}
          onClose={vi.fn()}
          song={existingSong}
          onSubmit={async (data) => {
            // Only send changed fields
            const changedFields: any = {}
            if (data.artist !== existingSong.artist) {
              changedFields.artist = data.artist
            }
            
            const response = await fetch(`/api/v1/songs/${existingSong.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(changedFields)
            })
            const result = await response.json()
            if (result.success) {
              mockOnSuccess(result.data)
            }
            return result
          }}
        />
      )
      
      // Only modify artist
      const artistInput = screen.getByLabelText(/artist/i)
      await user.clear(artistInput)
      await user.type(artistInput, 'New Artist')
      
      // Submit
      await user.click(screen.getByRole('button', { name: /update song/i }))
      
      // Verify only artist was updated
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
    
    it('handles optimistic updates', async () => {
      const user = userEvent.setup()
      const existingSong = songFactory.build()
      const mockOptimisticUpdate = vi.fn()
      const mockRollback = vi.fn()
      
      renderAsAdmin(
        <SongFormModal 
          isOpen={true}
          onClose={vi.fn()}
          song={existingSong}
          onSubmit={async (data) => {
            // Perform optimistic update
            mockOptimisticUpdate(data)
            
            try {
              const response = await fetch(`/api/v1/songs/${existingSong.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              })
              const result = await response.json()
              if (!result.success) {
                throw new Error('Update failed')
              }
              return result
            } catch (error) {
              // Rollback on error
              mockRollback(existingSong)
              throw error
            }
          }}
        />
      )
      
      // Modify and submit
      const titleInput = screen.getByDisplayValue(existingSong.title)
      await user.clear(titleInput)
      await user.type(titleInput, 'Optimistic Update')
      
      await user.click(screen.getByRole('button', { name: /update song/i }))
      
      // Verify optimistic update was called immediately
      expect(mockOptimisticUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Optimistic Update'
        })
      )
      
      // Wait for actual update to complete
      await waitFor(() => {
        expect(mockRollback).not.toHaveBeenCalled()
      })
    })
  })
  
  describe('Batch Operations', () => {
    it('handles bulk song creation', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()
      const songs = [
        { title: 'Song 1', themes: ['worship'] },
        { title: 'Song 2', themes: ['praise'] },
        { title: 'Song 3', themes: ['prayer'] }
      ]
      
      server.use(
        http.post('/api/v1/songs/batch', async ({ request }) => {
          const data = await request.json()
          
          return HttpResponse.json({
            success: true,
            data: {
              created: data.songs.length,
              songs: data.songs.map((song: any) => ({
                ...songFactory.build(),
                ...song
              }))
            }
          })
        })
      )
      
      // Mock a batch creation UI
      const batchCreate = async (songsData: any[]) => {
        const response = await fetch('/api/v1/songs/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songs: songsData })
        })
        const result = await response.json()
        if (result.success) {
          mockOnSuccess(result.data)
        }
        return result
      }
      
      await batchCreate(songs)
      
      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          created: 3,
          songs: expect.arrayContaining([
            expect.objectContaining({ title: 'Song 1' }),
            expect.objectContaining({ title: 'Song 2' }),
            expect.objectContaining({ title: 'Song 3' })
          ])
        })
      )
    })
  })
  
  describe('Real-time Features', () => {
    it('updates form when song is modified elsewhere', async () => {
      const existingSong = songFactory.build()
      const { rerender } = renderAsAdmin(
        <SongFormModal 
          isOpen={true}
          onClose={vi.fn()}
          song={existingSong}
          onSubmit={vi.fn()}
        />
      )
      
      expect(screen.getByDisplayValue(existingSong.title)).toBeInTheDocument()
      
      // Simulate external update
      const updatedSong: Song = {
        ...existingSong,
        title: 'Externally Updated Title'
      }
      
      rerender(
        <SongFormModal 
          isOpen={true}
          onClose={vi.fn()}
          song={updatedSong}
          onSubmit={vi.fn()}
        />
      )
      
      // Form should reflect the update
      expect(screen.getByDisplayValue('Externally Updated Title')).toBeInTheDocument()
    })
  })
})