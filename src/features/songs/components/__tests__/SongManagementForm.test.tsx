import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SongManagementForm } from '../SongManagementForm'
import { NotificationProvider } from '@shared/components/notifications'
import type { Song } from '../../types/song.types'
import type { User } from '@supabase/supabase-js'

// Mock the hooks
vi.mock('@features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com', is_anonymous: false },
    isAdmin: false
  }))
}))

vi.mock('../../hooks/mutations/useCreateSong', () => ({
  useCreateSong: vi.fn(() => ({
    createSong: vi.fn().mockResolvedValue({
      id: 'new-song-id',
      title: 'Test Song',
      artist: 'Test Artist',
      slug: 'test-song-ta-12345'
    })
  }))
}))

vi.mock('../../hooks/mutations/useUpdateSong', () => ({
  useUpdateSong: vi.fn(() => ({
    updateSong: vi.fn().mockResolvedValue({
      id: 'existing-song-id',
      title: 'Updated Song',
      artist: 'Updated Artist',
      slug: 'existing-slug'
    })
  }))
}))

vi.mock('../../hooks/useSongs', () => ({
  useSongs: vi.fn(() => ({
    songs: [
      {
        id: 'song-1',
        title: 'Amazing Grace',
        artist: 'John Newton',
        slug: 'amazing-grace-jn-12345',
        themes: ['grace', 'redemption'],
        compositionYear: 1779
      },
      {
        id: 'song-2',
        title: 'How Great Thou Art',
        artist: 'Carl Boberg',
        slug: 'how-great-thou-art-cb-67890',
        themes: ['worship', 'praise'],
        compositionYear: 1885
      }
    ]
  }))
}))

vi.mock('../../validation/hooks/useDuplicateDetection', () => ({
  useRealtimeDuplicateDetection: vi.fn(() => ({
    duplicates: [],
    hasExactMatch: false,
    isChecking: false
  }))
}))

vi.mock('../../validation/hooks/useSlugGeneration', () => ({
  useAutoSlugGeneration: vi.fn(() => ({
    slug: 'test-slug-12345',
    isGenerating: false,
    error: null
  }))
}))

// Helper function to render component with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <NotificationProvider>
      {component}
    </NotificationProvider>
  )
}

describe('SongManagementForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('should render all required form fields', () => {
      renderWithProviders(<SongManagementForm />)
      
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/artist/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/composition year/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/ccli number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/themes/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/make this song public/i)).toBeInTheDocument()
    })

    it('should show "Create Song" button for new songs', () => {
      renderWithProviders(<SongManagementForm />)
      
      expect(screen.getByRole('button', { name: /create song/i })).toBeInTheDocument()
    })

    it('should show "Update Song" button when editing', () => {
      const existingSong: Song = {
        id: 'song-123',
        title: 'Existing Song',
        artist: 'Existing Artist',
        slug: 'existing-song',
        themes: ['theme1'],
        metadata: {
          isPublic: true,
          views: 0,
          createdBy: 'user-123' // User owns this song
        }
      }
      
      renderWithProviders(<SongManagementForm song={existingSong} />)
      
      expect(screen.getByRole('button', { name: /update song/i })).toBeInTheDocument()
    })

    it('should pre-populate fields when editing existing song', () => {
      const existingSong: Song = {
        id: 'song-123',
        title: 'Existing Song',
        artist: 'Existing Artist',
        compositionYear: 2020,
        ccli: '12345',
        themes: ['worship', 'praise'],
        notes: 'Test notes',
        slug: 'existing-song',
        metadata: {
          isPublic: true,
          views: 0,
          createdBy: 'user-123' // User owns this song
        }
      }
      
      renderWithProviders(<SongManagementForm song={existingSong} />)
      
      expect(screen.getByDisplayValue('Existing Song')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing Artist')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2020')).toBeInTheDocument()
      expect(screen.getByDisplayValue('12345')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument()
      expect(screen.getByText('worship')).toBeInTheDocument()
      expect(screen.getByText('praise')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should require title field', async () => {
      renderWithProviders(<SongManagementForm />)
      
      const submitButton = screen.getByRole('button', { name: /create song/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
      })
    })

    it('should validate CCLI number format', async () => {
      renderWithProviders(<SongManagementForm />)
      
      const ccliInput = screen.getByLabelText(/ccli number/i)
      await userEvent.type(ccliInput, 'invalid')
      
      const titleInput = screen.getByLabelText(/title/i)
      await userEvent.type(titleInput, 'Test Song')
      
      const submitButton = screen.getByRole('button', { name: /create song/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/ccli must be 5-7 digits/i)).toBeInTheDocument()
      })
    })

    it('should validate year range', async () => {
      renderWithProviders(<SongManagementForm />)
      
      const yearInput = screen.getByLabelText(/composition year/i)
      await userEvent.type(yearInput, '3000')
      
      const titleInput = screen.getByLabelText(/title/i)
      await userEvent.type(titleInput, 'Test Song')
      
      const submitButton = screen.getByRole('button', { name: /create song/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/year cannot be in the future/i)).toBeInTheDocument()
      })
    })

    it('should require at least one theme', async () => {
      renderWithProviders(<SongManagementForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      await userEvent.type(titleInput, 'Test Song')
      
      const submitButton = screen.getByRole('button', { name: /create song/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/at least one theme is required/i)).toBeInTheDocument()
      })
    })

    it('should limit themes to maximum of 10', async () => {
      renderWithProviders(<SongManagementForm />)
      
      const themeInput = screen.getByPlaceholderText(/add a theme/i)
      const addButton = screen.getByRole('button', { name: /add/i })
      
      // Add 10 themes
      for (let i = 1; i <= 10; i++) {
        await userEvent.type(themeInput, `theme${i}`)
        fireEvent.click(addButton)
      }
      
      // Try to add 11th theme
      await userEvent.type(themeInput, 'theme11')
      
      expect(addButton).toBeDisabled()
      expect(screen.getByPlaceholderText(/maximum themes reached/i)).toBeInTheDocument()
    })
  })

  describe('Duplicate Detection', () => {
    it('should show duplicate warning when similar song exists', async () => {
      renderWithProviders(<SongManagementForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      await userEvent.type(titleInput, 'Amazing Grace')
      
      await waitFor(() => {
        expect(screen.getByText(/similar songs found/i)).toBeInTheDocument()
        expect(screen.getByText('John Newton')).toBeInTheDocument()
      })
    })
  })

  describe('Autocomplete Features', () => {
    it('should show artist suggestions when typing', async () => {
      renderWithProviders(<SongManagementForm />)
      
      const artistInput = screen.getByLabelText(/artist/i)
      await userEvent.type(artistInput, 'John')
      
      await waitFor(() => {
        expect(screen.getByText('John Newton')).toBeInTheDocument()
      })
    })

    it('should show theme suggestions from existing songs', async () => {
      renderWithProviders(<SongManagementForm />)
      
      const themeInput = screen.getByPlaceholderText(/add a theme/i)
      await userEvent.type(themeInput, 'wor')
      
      await waitFor(() => {
        expect(screen.getByText('worship')).toBeInTheDocument()
      })
    })
  })

  describe('Theme Management', () => {
    it('should add theme when Enter key is pressed', async () => {
      renderWithProviders(<SongManagementForm />)
      
      const themeInput = screen.getByPlaceholderText(/add a theme/i)
      await userEvent.type(themeInput, 'new-theme{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('new-theme')).toBeInTheDocument()
      })
    })

    it('should remove theme when X button is clicked', async () => {
      renderWithProviders(<SongManagementForm />)
      
      const themeInput = screen.getByPlaceholderText(/add a theme/i)
      await userEvent.type(themeInput, 'test-theme')
      
      const addButton = screen.getByRole('button', { name: /add/i })
      fireEvent.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('test-theme')).toBeInTheDocument()
      })
      
      const removeButton = screen.getByRole('button', { name: /remove test-theme/i })
      fireEvent.click(removeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('test-theme')).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should call onSuccess callback after successful creation', async () => {
      const onSuccess = vi.fn()
      renderWithProviders(<SongManagementForm onSuccess={onSuccess} />)
      
      // Fill required fields
      await userEvent.type(screen.getByLabelText(/title/i), 'New Song')
      await userEvent.selectOptions(screen.getByLabelText(/category/i), 'Traditional-Holy')
      
      // Add a theme
      const themeInput = screen.getByPlaceholderText(/add a theme/i)
      await userEvent.type(themeInput, 'worship')
      fireEvent.click(screen.getByRole('button', { name: /add/i }))
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create song/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'new-song-id',
            title: 'Test Song'
          })
        )
      })
    })

    it('should show loading state during submission', async () => {
      renderWithProviders(<SongManagementForm />)
      
      // Fill required fields
      await userEvent.type(screen.getByLabelText(/title/i), 'New Song')
      await userEvent.selectOptions(screen.getByLabelText(/category/i), 'Traditional-Holy')
      
      // Add a theme
      const themeInput = screen.getByPlaceholderText(/add a theme/i)
      await userEvent.type(themeInput, 'worship')
      fireEvent.click(screen.getByRole('button', { name: /add/i }))
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create song/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument()
      })
    })
  })

  describe('Permission Handling', () => {
    it('should show guest user notice for anonymous users', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { 
          id: 'anon-123', 
          is_anonymous: true, 
          email: null,
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as unknown as User,
        isAdmin: false
      } as ReturnType<typeof useAuth>)
      
      renderWithProviders(<SongManagementForm />)
      
      expect(screen.getByText(/you're adding this song as a guest/i)).toBeInTheDocument()
    })
  })

  describe('Cancel Functionality', () => {
    it('should call onCancel when Cancel button is clicked', () => {
      const onCancel = vi.fn()
      renderWithProviders(<SongManagementForm onCancel={onCancel} />)
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)
      
      expect(onCancel).toHaveBeenCalled()
    })
  })
})

// Import for mocking
import { useAuth } from '@features/auth/hooks/useAuth'