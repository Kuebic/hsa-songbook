import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArrangementManagementModal } from '../ArrangementManagementModal'
import { NotificationProvider } from '@shared/components/notifications'
import type { Arrangement } from '../../types/song.types'
import * as useArrangementMutationsModule from '../../hooks/mutations/useArrangementMutations'

// Mock the hooks and components
vi.mock('@features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com', is_anonymous: false },
    isAdmin: false
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

describe('ArrangementManagementModal Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Modal Behavior', () => {
    it('should render modal when open', () => {
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
        />
      )
      
      expect(screen.getByTestId('arrangement-management-modal')).toBeInTheDocument()
      expect(screen.getByText('Add New Arrangement')).toBeInTheDocument()
      expect(screen.getByText('Fill in the details to add a new arrangement to the song')).toBeInTheDocument()
    })

    it('should not render modal when closed', () => {
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={false}
          onClose={vi.fn()}
        />
      )
      
      expect(screen.queryByTestId('arrangement-management-modal')).not.toBeInTheDocument()
    })

    it('should show edit title and description for existing arrangement', () => {
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
      
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          arrangement={existingArrangement}
        />
      )
      
      expect(screen.getByText('Edit Arrangement')).toBeInTheDocument()
      expect(screen.getByText('Update the details of this arrangement')).toBeInTheDocument()
    })

    it('should close modal when onClose is called', () => {
      const onClose = vi.fn()
      
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={onClose}
        />
      )
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)
      
      expect(onClose).toHaveBeenCalled()
    })

    it('should prevent closing on overlay click', () => {
      const onClose = vi.fn()
      
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={onClose}
        />
      )
      
      // Try to click outside the modal (this would normally close it)
      const modal = screen.getByTestId('arrangement-management-modal')
      fireEvent.click(modal)
      
      // Modal should still be open since closeOnOverlayClick=false
      expect(onClose).not.toHaveBeenCalled()
    })

    it('should support escape key to close', () => {
      const onClose = vi.fn()
      
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={onClose}
        />
      )
      
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
      
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Form Integration', () => {
    it('should pass songId to form component', () => {
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          songId="song-123"
        />
      )
      
      // Should show song context in the form
      expect(screen.getByText(/song:/i)).toBeInTheDocument()
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    })

    it('should pass arrangement data to form for editing', () => {
      const existingArrangement: Arrangement = {
        id: 'arrangement-123',
        name: 'Existing Arrangement',
        slug: 'existing-arrangement',
        songIds: ['song-123'],
        key: 'G',
        tempo: 120,
        difficulty: 'intermediate',
        tags: ['acoustic'],
        chordData: '{title: Test}',
        createdBy: 'user-123',
        metadata: { isPublic: true, views: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          arrangement={existingArrangement}
        />
      )
      
      // Form should be pre-populated with arrangement data
      expect(screen.getByDisplayValue('Existing Arrangement')).toBeInTheDocument()
      expect(screen.getByDisplayValue('G')).toBeInTheDocument()
      expect(screen.getByDisplayValue('120')).toBeInTheDocument()
      expect(screen.getByDisplayValue('intermediate')).toBeInTheDocument()
    })

    it('should handle successful form submission', async () => {
      const onSuccess = vi.fn()
      const onClose = vi.fn()
      
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={onClose}
          onSuccess={onSuccess}
          songId="song-123"
        />
      )
      
      // Fill and submit form
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Test Arrangement')
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'new-arrangement-id',
            name: 'Test Arrangement'
          })
        )
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('should remain open if form submission fails', async () => {
      const createArrangementMock = vi.fn().mockRejectedValueOnce(new Error('Creation failed'))
      vi.mocked(useArrangementMutationsModule.useArrangementMutations).mockReturnValue({
        createArrangement: createArrangementMock,
        updateArrangement: vi.fn(),
        updateArrangementName: vi.fn(),
        updateArrangementField: vi.fn(),
        deleteArrangement: vi.fn(),
        rateArrangement: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        isRating: false,
        error: null,
        optimisticArrangements: [],
        clearError: vi.fn(),
        isAuthenticated: true
      })
      
      const onClose = vi.fn()
      
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={onClose}
          songId="song-123"
        />
      )
      
      // Fill and submit form
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Test Arrangement')
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/creation failed/i)).toBeInTheDocument()
      })
      
      // Modal should still be open
      expect(onClose).not.toHaveBeenCalled()
      expect(screen.getByTestId('arrangement-management-modal')).toBeInTheDocument()
    })
  })

  describe('ChordPro Workflow Integration', () => {
    it('should handle ChordPro text input and validation', async () => {
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          songId="song-123"
        />
      )
      
      const chordProInput = screen.getByLabelText(/chordpro text/i)
      const chordProText = `{title: Amazing Grace}
{key: G}
{time: 3/4}

{start_of_verse}
[G]Amazing [C]grace how [G]sweet the [D]sound
That [G]saved a [C]wretch like [G]me [D]
{end_of_verse}`
      
      await userEvent.type(chordProInput, chordProText)
      
      expect(chordProInput).toHaveValue(chordProText)
      
      // Fill required fields and submit
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'ChordPro Arrangement')
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        const mockMutations = vi.mocked(useArrangementMutationsModule.useArrangementMutations)()
        expect(mockMutations.createArrangement).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'ChordPro Arrangement',
            chordProText: chordProText
          })
        )
      })
    })

    it('should handle empty ChordPro text gracefully', async () => {
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          songId="song-123"
        />
      )
      
      // Leave ChordPro field empty and submit
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Empty ChordPro Arrangement')
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        const mockMutations = vi.mocked(useArrangementMutationsModule.useArrangementMutations)()
        expect(mockMutations.createArrangement).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Empty ChordPro Arrangement',
            chordProText: ''
          })
        )
      })
    })

    it('should preserve ChordPro formatting during editing', async () => {
      const existingArrangement: Arrangement = {
        id: 'arrangement-123',
        name: 'ChordPro Arrangement',
        slug: 'chordpro-arrangement',
        songIds: ['song-123'],
        key: 'C',
        difficulty: 'beginner',
        tags: [],
        chordData: '{title: Amazing Grace}\n{key: G}\n[G]Amazing [C]grace',
        createdBy: 'user-123',
        metadata: { isPublic: true, views: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          arrangement={existingArrangement}
        />
      )
      
      const chordProInput = screen.getByLabelText(/chordpro text/i)
      expect(chordProInput).toHaveValue('{title: Amazing Grace}\n{key: G}\n[G]Amazing [C]grace')
      
      // Modify ChordPro text
      await userEvent.clear(chordProInput)
      await userEvent.type(chordProInput, '{title: Amazing Grace - Modified}\n{key: C}\n[C]Amazing [F]grace')
      
      const submitButton = screen.getByRole('button', { name: /update arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        const mockMutations = vi.mocked(useArrangementMutationsModule.useArrangementMutations)()
        expect(mockMutations.updateArrangement).toHaveBeenCalledWith(
          'arrangement-123',
          expect.objectContaining({
            chordProText: '{title: Amazing Grace - Modified}\n{key: C}\n[C]Amazing [F]grace'
          })
        )
      })
    })

    it('should handle large ChordPro files within limits', async () => {
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          songId="song-123"
        />
      )
      
      // Create a large but valid ChordPro text (well within 50KB limit)
      const largeChordPro = `{title: Large Arrangement}
{key: C}

${Array.from({ length: 50 }, (_, i) => `{start_of_verse}
[C]Verse ${i + 1} line [F]one with [G]chords
[C]Verse ${i + 1} line [F]two with [G]chords
{end_of_verse}

{start_of_chorus}
[Am]Chorus line [F]one with [C]chords [G]here
[Am]Chorus line [F]two with [C]chords [G]here
{end_of_chorus}

`).join('')}`
      
      const chordProInput = screen.getByLabelText(/chordpro text/i)
      await userEvent.type(chordProInput, largeChordPro)
      
      expect(chordProInput).toHaveValue(largeChordPro)
      
      // Should be able to submit without size errors
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Large Arrangement')
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.queryByText(/chord data is too large/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Musical Properties Integration', () => {
    it('should validate and submit complete musical arrangement', async () => {
      const onSuccess = vi.fn()
      
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={onSuccess}
          songId="song-123"
        />
      )
      
      // Fill all musical properties
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Complete Musical Arrangement')
      
      const keySelect = screen.getByLabelText(/key/i)
      await userEvent.selectOptions(keySelect, 'G')
      
      const tempoInput = screen.getByLabelText(/tempo/i)
      await userEvent.type(tempoInput, '120')
      
      const timeSignatureSelect = screen.getByLabelText(/time signature/i)
      await userEvent.selectOptions(timeSignatureSelect, '3/4')
      
      const difficultySelect = screen.getByLabelText(/difficulty/i)
      await userEvent.selectOptions(difficultySelect, 'intermediate')
      
      // Add tags
      const tagInput = screen.getByLabelText(/tags/i)
      await userEvent.type(tagInput, 'acoustic')
      const addTagButton = screen.getByRole('button', { name: /add/i })
      fireEvent.click(addTagButton)
      
      await userEvent.type(tagInput, 'fingerpicking')
      fireEvent.click(addTagButton)
      
      // Add description
      const descriptionInput = screen.getByLabelText(/description/i)
      await userEvent.type(descriptionInput, 'A beautiful acoustic arrangement with fingerpicking patterns')
      
      // Add ChordPro text
      const chordProInput = screen.getByLabelText(/chordpro text/i)
      await userEvent.type(chordProInput, '{title: Complete Musical Arrangement}\n{key: G}\n{time: 3/4}\n[G]Amazing [C]grace')
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        const mockMutations = vi.mocked(useArrangementMutationsModule.useArrangementMutations)()
        expect(mockMutations.createArrangement).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Complete Musical Arrangement',
            key: 'G',
            tempo: 120,
            timeSignature: '3/4',
            difficulty: 'intermediate',
            tags: ['acoustic', 'fingerpicking'],
            description: 'A beautiful acoustic arrangement with fingerpicking patterns',
            chordProText: '{title: Complete Musical Arrangement}\n{key: G}\n{time: 3/4}\n[G]Amazing [C]grace',
            songIds: ['song-123']
          })
        )
      })
    })

    it('should handle musical validation errors', async () => {
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          songId="song-123"
        />
      )
      
      // Fill name but set invalid tempo
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Invalid Tempo Arrangement')
      
      const tempoInput = screen.getByLabelText(/tempo/i)
      await userEvent.type(tempoInput, '300') // Above maximum
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/tempo must be less than 240 bpm/i)).toBeInTheDocument()
      })
    })
  })

  describe('Auto-generation Features', () => {
    it('should auto-generate arrangement name from song title', async () => {
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          songId="song-123"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Amazing Grace - Arrangement')).toBeInTheDocument()
      })
    })

    it('should not auto-generate name when editing existing arrangement', () => {
      const existingArrangement: Arrangement = {
        id: 'arrangement-123',
        name: 'Custom Arrangement Name',
        slug: 'custom-arrangement',
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
      
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          arrangement={existingArrangement}
          songId="song-123"
        />
      )
      
      expect(screen.getByDisplayValue('Custom Arrangement Name')).toBeInTheDocument()
      expect(screen.queryByDisplayValue('Amazing Grace - Arrangement')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling Integration', () => {
    it('should display form validation errors in modal context', async () => {
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          songId="song-123"
        />
      )
      
      // Clear the auto-generated name to trigger validation error
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.clear(nameInput)
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/arrangement name is required/i)).toBeInTheDocument()
      })
      
      // Modal should remain open
      expect(screen.getByTestId('arrangement-management-modal')).toBeInTheDocument()
    })

    it('should handle network errors gracefully', async () => {
      const createArrangementMock = vi.fn().mockRejectedValueOnce(new Error('Network error: Unable to connect'))
      vi.mocked(useArrangementMutationsModule.useArrangementMutations).mockReturnValue({
        createArrangement: createArrangementMock,
        updateArrangement: vi.fn(),
        updateArrangementName: vi.fn(),
        updateArrangementField: vi.fn(),
        deleteArrangement: vi.fn(),
        rateArrangement: vi.fn(),
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        isRating: false,
        error: null,
        optimisticArrangements: [],
        clearError: vi.fn(),
        isAuthenticated: true
      })
      
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          songId="song-123"
        />
      )
      
      const nameInput = screen.getByLabelText(/arrangement name/i)
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'Network Test Arrangement')
      
      const submitButton = screen.getByRole('button', { name: /create arrangement/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/network error: unable to connect/i)).toBeInTheDocument()
      })
      
      // Modal should remain open for user to retry
      expect(screen.getByTestId('arrangement-management-modal')).toBeInTheDocument()
    })
  })

  describe('Accessibility Integration', () => {
    it('should maintain focus management within modal', async () => {
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          songId="song-123"
        />
      )
      
      // First focusable element (arrangement name) should be focused
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/arrangement name/i)
        expect(document.activeElement).toBe(nameInput)
      })
    })

    it('should support keyboard navigation between form fields', async () => {
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
          songId="song-123"
        />
      )
      
      const nameInput = screen.getByLabelText(/arrangement name/i)
      const keySelect = screen.getByLabelText(/key/i)
      
      expect(document.activeElement).toBe(nameInput)
      
      // Tab to next field
      await userEvent.tab()
      expect(document.activeElement).toBe(keySelect)
    })

    it('should announce modal title to screen readers', () => {
      renderWithProviders(
        <ArrangementManagementModal
          isOpen={true}
          onClose={vi.fn()}
        />
      )
      
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby')
      expect(screen.getByText('Add New Arrangement')).toBeInTheDocument()
    })
  })
})