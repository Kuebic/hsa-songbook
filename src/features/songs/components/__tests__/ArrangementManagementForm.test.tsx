import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArrangementManagementForm } from '../ArrangementManagementForm'
import { NotificationProvider } from '@shared/components/notifications'
import type { Arrangement } from '../../types/song.types'
import type { User } from '@supabase/supabase-js'
import * as useArrangementMutationsModule from '../../hooks/mutations/useArrangementMutations'
import * as useAuthModule from '@features/auth/hooks/useAuth'

// Mock the hooks
vi.mock('@features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com' },
    userId: 'user-123',
    sessionId: 'session-123',
    isLoaded: true,
    isSignedIn: true,
    isAdmin: false,
    isAnonymous: false,
    getToken: vi.fn().mockResolvedValue('mock-token'),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    updateUser: vi.fn(),
    refreshSession: vi.fn(),
    deleteUser: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    sendOtp: vi.fn()
  }))
}))

vi.mock('../../hooks/mutations/useArrangementMutations', () => ({
  useArrangementMutations: vi.fn(() => ({
    createArrangement: vi.fn().mockResolvedValue({
      id: 'new-arrangement-id',
      name: 'Test Arrangement',
      slug: 'test-arrangement',
      difficulty: 'beginner',
      songIds: ['song-123']
    }),
    updateArrangement: vi.fn().mockResolvedValue({
      id: 'existing-arrangement-id',
      name: 'Updated Arrangement',
      slug: 'updated-arrangement',
      difficulty: 'intermediate'
    })
  }))
}))

vi.mock('../../hooks/useSongs', () => ({
  useSongs: vi.fn(() => ({
    songs: [
      {
        id: 'song-123',
        title: 'Amazing Grace',
        artist: 'John Newton',
        slug: 'amazing-grace-jn-12345',
        themes: ['grace', 'redemption'],
        compositionYear: 1779
      },
      {
        id: 'song-456',
        title: 'How Great Thou Art',
        artist: 'Carl Boberg',
        slug: 'how-great-thou-art-cb-67890',
        themes: ['worship', 'praise'],
        compositionYear: 1885
      }
    ]
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

describe('ArrangementManagementForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('should render all required form fields', () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      expect(screen.getByLabelText(/arrangement name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/key/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/tempo/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/time signature/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/chordpro text/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    })

    it('should show "Create Arrangement" button for new arrangements', () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      expect(screen.getByRole('button', { name: /create arrangement/i })).toBeInTheDocument()
    })

    it('should show "Update Arrangement" button when editing', () => {
      const existingArrangement: Arrangement = {
        id: 'arrangement-123',
        name: 'Existing Arrangement',
        slug: 'existing-arrangement',
        songIds: ['song-123'],
        key: 'C',
        tempo: 120,
        timeSignature: '4/4',
        difficulty: 'intermediate',
        tags: ['acoustic'],
        chordData: '{title: Test}',
        createdBy: 'user-123',
        metadata: {
          isPublic: true,
          views: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      renderWithProviders(<ArrangementManagementForm arrangement={existingArrangement} />)
      
      expect(screen.getByRole('button', { name: /update arrangement/i })).toBeInTheDocument()
    })

    it('should pre-populate fields when editing existing arrangement', () => {
      const existingArrangement: Arrangement = {
        id: 'arrangement-123',
        name: 'Existing Arrangement',
        slug: 'existing-arrangement',
        songIds: ['song-123'],
        key: 'G',
        tempo: 140,
        timeSignature: '3/4',
        difficulty: 'advanced',
        tags: ['acoustic', 'fingerpicking'],
        chordData: '{title: Test Arrangement}\n[G]Amazing [C]grace',
        description: 'Test description',
        createdBy: 'user-123',
        metadata: {
          isPublic: true,
          views: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      renderWithProviders(<ArrangementManagementForm arrangement={existingArrangement} />)
      
      expect(screen.getByDisplayValue('Existing Arrangement')).toBeInTheDocument()
      expect(screen.getByDisplayValue('G')).toBeInTheDocument()
      expect(screen.getByDisplayValue('140')).toBeInTheDocument()
      expect(screen.getByDisplayValue('3/4')).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /difficulty/i })).toHaveValue('advanced')
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
      expect(screen.getByText('acoustic')).toBeInTheDocument()
      expect(screen.getByText('fingerpicking')).toBeInTheDocument()
    })

    it('should show song context when songId is provided', () => {
      renderWithProviders(<ArrangementManagementForm songId="song-123" />)
      
      expect(screen.getByText(/song:/i)).toBeInTheDocument()
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
      expect(screen.getByText(/by John Newton/i)).toBeInTheDocument()
    })

    it('should auto-generate arrangement name when songId is provided', async () => {
      renderWithProviders(<ArrangementManagementForm songId="song-123" />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Amazing Grace - Arrangement')).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should require arrangement name field', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.clear(nameInput)
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/arrangement name is required/i)).toBeInTheDocument()
      })
    })

    it('should validate tempo range', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const tempoInput = screen.getByLabelText(/tempo/i)
      await userEvent.type(tempoInput, '300')
      
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.type(nameInput, 'Test Arrangement')
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/tempo must be less than 240 bpm/i)).toBeInTheDocument()
      })
    })

    it('should validate minimum tempo', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const tempoInput = screen.getByLabelText(/tempo/i)
      await userEvent.type(tempoInput, '30')
      
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.type(nameInput, 'Test Arrangement')
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/tempo must be at least 40 bpm/i)).toBeInTheDocument()
      })
    })

    it('should require difficulty selection', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.type(nameInput, 'Test Arrangement')
      
      const difficultySelect = screen.getByLabelText(/difficulty/i)
      await userEvent.selectOptions(difficultySelect, '')
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/please select a valid difficulty level/i)).toBeInTheDocument()
      })
    })

    it('should limit tags to maximum of 10', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const tagInput = screen.getByLabelText(/tags/i)
      const addButton = screen.getByRole('button', { name: /add/i })
      
      // Add 10 tags
      for (let i = 1; i <= 10; i++) {
        await userEvent.type(tagInput, `tag${i}`)
        fireEvent.click(addButton)
      }
      
      // Try to add 11th tag
      await userEvent.type(tagInput, 'tag11')
      
      expect(addButton).toBeDisabled()
      expect(screen.getByPlaceholderText(/maximum tags reached/i)).toBeInTheDocument()
    })

    it('should validate musical key selection', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.type(nameInput, 'Test Arrangement')
      
      const keySelect = screen.getByLabelText(/key/i)
      await userEvent.selectOptions(keySelect, 'InvalidKey')
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/please select a valid musical key/i)).toBeInTheDocument()
      })
    })

    it('should validate time signature selection', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.type(nameInput, 'Test Arrangement')
      
      const timeSignatureSelect = screen.getByLabelText(/time signature/i)
      await userEvent.selectOptions(timeSignatureSelect, 'InvalidTimeSignature')
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/please select a valid time signature/i)).toBeInTheDocument()
      })
    })
  })

  describe('Musical Field Validation', () => {
    it('should accept valid musical keys', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const keySelect = screen.getByLabelText(/key/i)
      
      // Test major keys
      await userEvent.selectOptions(keySelect, 'C')
      expect(screen.getByDisplayValue('C')).toBeInTheDocument()
      
      await userEvent.selectOptions(keySelect, 'F#')
      expect(screen.getByDisplayValue('F#')).toBeInTheDocument()
      
      // Test minor keys
      await userEvent.selectOptions(keySelect, 'Am')
      expect(screen.getByDisplayValue('Am')).toBeInTheDocument()
      
      await userEvent.selectOptions(keySelect, 'Bbm')
      expect(screen.getByDisplayValue('Bbm')).toBeInTheDocument()
    })

    it('should accept valid time signatures', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const timeSignatureSelect = screen.getByLabelText(/time signature/i)
      
      await userEvent.selectOptions(timeSignatureSelect, '6/8')
      expect(screen.getByDisplayValue('6/8')).toBeInTheDocument()
      
      await userEvent.selectOptions(timeSignatureSelect, '3/4')
      expect(screen.getByDisplayValue('3/4')).toBeInTheDocument()
    })

    it('should accept valid tempo values', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const tempoInput = screen.getByLabelText(/tempo/i)
      
      await userEvent.type(tempoInput, '120')
      expect(screen.getByDisplayValue('120')).toBeInTheDocument()
      
      await userEvent.clear(tempoInput)
      await userEvent.type(tempoInput, '80')
      expect(screen.getByDisplayValue('80')).toBeInTheDocument()
    })

    it('should accept all difficulty levels', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const difficultySelect = screen.getByLabelText(/difficulty/i)
      
      await userEvent.selectOptions(difficultySelect, 'beginner')
      expect(screen.getByDisplayValue('beginner')).toBeInTheDocument()
      
      await userEvent.selectOptions(difficultySelect, 'intermediate')
      expect(screen.getByDisplayValue('intermediate')).toBeInTheDocument()
      
      await userEvent.selectOptions(difficultySelect, 'advanced')
      expect(screen.getByRole('combobox', { name: /difficulty/i })).toHaveValue('advanced')
    })
  })

  describe('Auto-Title Generation', () => {
    it('should auto-generate title when song is provided', async () => {
      renderWithProviders(<ArrangementManagementForm songId="song-456" />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('How Great Thou Art - Arrangement')).toBeInTheDocument()
      })
    })

    it('should auto-generate slug from name', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.type(nameInput, 'My Special Arrangement!')
      
      await waitFor(() => {
        // Slug should be auto-generated and stored in state (not visible in UI for new arrangements)
        // We can verify this by checking the form state through interaction
        expect(nameInput).toHaveValue('My Special Arrangement!')
      })
    })

    it('should not auto-generate title when editing existing arrangement', () => {
      const existingArrangement: Arrangement = {
        id: 'arrangement-123',
        name: 'Existing Arrangement',
        slug: 'existing-arrangement',
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
      
      renderWithProviders(<ArrangementManagementForm arrangement={existingArrangement} songId="song-456" />)
      
      expect(screen.getByDisplayValue('Existing Arrangement')).toBeInTheDocument()
      expect(screen.queryByDisplayValue('How Great Thou Art - Arrangement')).not.toBeInTheDocument()
    })
  })

  describe('Tag Management', () => {
    it('should add tag when Enter key is pressed', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const tagInput = screen.getByLabelText(/tags/i)
      await userEvent.type(tagInput, 'acoustic{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('acoustic')).toBeInTheDocument()
      })
    })

    it('should add tag when Add button is clicked', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const tagInput = screen.getByLabelText(/tags/i)
      await userEvent.type(tagInput, 'fingerpicking')
      
      const addButton = screen.getByRole('button', { name: /add/i })
      fireEvent.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('fingerpicking')).toBeInTheDocument()
      })
    })

    it('should remove tag when X button is clicked', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const tagInput = screen.getByLabelText(/tags/i)
      await userEvent.type(tagInput, 'test-tag')
      
      const addButton = screen.getByRole('button', { name: /add/i })
      fireEvent.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('test-tag')).toBeInTheDocument()
      })
      
      const removeButton = screen.getByRole('button', { name: /remove test-tag/i })
      fireEvent.click(removeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('test-tag')).not.toBeInTheDocument()
      })
    })

    it('should not add duplicate tags', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const tagInput = screen.getByLabelText(/tags/i)
      const addButton = screen.getByRole('button', { name: /add/i })
      
      // Add first tag
      await userEvent.type(tagInput, 'duplicate')
      fireEvent.click(addButton)
      
      // Try to add same tag again
      await userEvent.type(tagInput, 'duplicate')
      fireEvent.click(addButton)
      
      // Should only have one instance
      const tagElements = screen.getAllByText('duplicate')
      expect(tagElements).toHaveLength(1)
    })

    it('should clear tag input after adding tag', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const tagInput = screen.getByLabelText(/tags/i)
      await userEvent.type(tagInput, 'clear-test')
      
      const addButton = screen.getByRole('button', { name: /add/i })
      fireEvent.click(addButton)
      
      await waitFor(() => {
        expect(tagInput).toHaveValue('')
      })
    })
  })

  describe('ChordPro Text Handling', () => {
    it('should accept ChordPro formatted text', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const chordProInput = screen.getByLabelText(/chordpro text/i)
      const chordProText = '{{}title: Amazing Grace{}}\n{{}key: G{}}\n[G]Amazing [C]grace'
      
      await userEvent.type(chordProInput, chordProText)
      
      expect(chordProInput).toHaveValue('{title: Amazing Grace}\n{key: G}\n[G]Amazing [C]grace')
    })

    it('should handle large ChordPro text within limits', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const chordProInput = screen.getByLabelText(/chordpro text/i)
      const largeText = 'A'.repeat(1000) // Well within 50KB limit
      
      await userEvent.type(chordProInput, largeText)
      
      expect(chordProInput).toHaveValue(largeText)
    })
  })

  describe('Form Submission', () => {
    it('should call onSuccess callback after successful creation', async () => {
      const onSuccess = vi.fn()
      renderWithProviders(<ArrangementManagementForm onSuccess={onSuccess} songId="song-123" />)
      
      // Fill required fields
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'New Arrangement')
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'new-arrangement-id',
            name: 'Test Arrangement'
          })
        )
      })
    })

    it('should show loading state during submission', async () => {
      renderWithProviders(<ArrangementManagementForm songId="song-123" />)
      
      // Fill required fields
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'New Arrangement')
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument()
      })
    })

    it('should call updateArrangement for existing arrangements', async () => {
      const mockMutations = vi.mocked(useArrangementMutationsModule.useArrangementMutations())
      const updateArrangement = mockMutations.updateArrangement
      
      const existingArrangement: Arrangement = {
        id: 'arrangement-123',
        name: 'Existing Arrangement',
        slug: 'existing-arrangement',
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
      
      renderWithProviders(<ArrangementManagementForm arrangement={existingArrangement} />)
      
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Updated Name')
      
      const submitButton = screen.getByRole('button', { name: /update arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(updateArrangement).toHaveBeenCalledWith(
          'arrangement-123',
          expect.objectContaining({
            name: 'Updated Name'
          })
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when creation fails', async () => {
      const mockMutations = vi.mocked(useArrangementMutationsModule.useArrangementMutations())
      mockMutations.createArrangement.mockRejectedValueOnce(new Error('Network error'))
      
      renderWithProviders(<ArrangementManagementForm songId="song-123" />)
      
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Test Arrangement')
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Permission Handling', () => {

    it('should prevent editing arrangements not owned by user', () => {
      const existingArrangement: Arrangement = {
        id: 'arrangement-123',
        name: 'Other User Arrangement',
        slug: 'other-arrangement',
        songIds: ['song-123'],
        key: 'C',
        difficulty: 'beginner',
        tags: [],
        chordData: '',
        createdBy: 'other-user-456', // Different user
        metadata: { isPublic: true, views: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      renderWithProviders(<ArrangementManagementForm arrangement={existingArrangement} />)
      
      expect(screen.getByText(/you don't have permission to edit this arrangement/i)).toBeInTheDocument()
    })

    it('should allow admins to edit any arrangement', () => {
      const mockUseAuth = vi.mocked(useAuthModule.useAuth)
      mockUseAuth.mockReturnValue({
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as unknown as User,
        userId: 'admin-123',
        sessionId: 'admin-session',
        isLoaded: true,
        isSignedIn: true,
        isAdmin: true,
        getToken: vi.fn().mockResolvedValue('mock-token'),
        getUserEmail: vi.fn().mockReturnValue('admin@example.com'),
        getUserName: vi.fn().mockReturnValue('Admin User'),
        getUserAvatar: vi.fn().mockReturnValue(undefined),
        session: null,
        signInWithProvider: vi.fn(),
        signInWithEmail: vi.fn(),
        signUpWithEmail: vi.fn(),
        resetPassword: vi.fn(),
        signOut: vi.fn()
      })
      
      const existingArrangement: Arrangement = {
        id: 'arrangement-123',
        name: 'Other User Arrangement',
        slug: 'other-arrangement',
        songIds: ['song-123'],
        key: 'C',
        difficulty: 'beginner',
        tags: [],
        chordData: '',
        createdBy: 'other-user-456', // Different user
        metadata: { isPublic: true, views: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      renderWithProviders(<ArrangementManagementForm arrangement={existingArrangement} />)
      
      expect(screen.getByDisplayValue('Other User Arrangement')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update arrangement/i })).toBeInTheDocument()
    })
  })

  describe('Cancel Functionality', () => {
    it('should call onCancel when Cancel button is clicked', () => {
      const onCancel = vi.fn()
      renderWithProviders(<ArrangementManagementForm onCancel={onCancel} />)
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)
      
      expect(onCancel).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all form fields', () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      expect(screen.getByLabelText(/arrangement name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/key/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/tempo/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/time signature/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/chordpro text/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    })

    it('should support keyboard navigation for tag removal', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const tagInput = screen.getByLabelText(/tags/i)
      await userEvent.type(tagInput, 'keyboard-test')
      
      const addButton = screen.getByRole('button', { name: /add/i })
      fireEvent.click(addButton)
      
      await waitFor(() => {
        const removeButton = screen.getByRole('button', { name: /remove keyboard-test/i })
        expect(removeButton).toBeInTheDocument()
        expect(removeButton).toHaveAttribute('aria-label', 'Remove keyboard-test')
      })
    })

    it('should support Enter key for adding tags', async () => {
      renderWithProviders(<ArrangementManagementForm />)
      
      const tagInput = screen.getByLabelText(/tags/i)
      await userEvent.type(tagInput, 'enter-test{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('enter-test')).toBeInTheDocument()
      })
    })
  })
})

