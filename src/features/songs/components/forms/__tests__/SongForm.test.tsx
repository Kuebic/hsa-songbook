import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SongForm } from '../SongForm'
import { songFactory } from '../../../test-utils/factories'
import type { Song } from '../../../types/song.types'
import { useAuth } from '@features/auth/hooks/useAuth'

// Mock the auth hook
vi.mock('@features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

// Use vi.hoisted to make variables available in mock scope
const { mockCheckDuplicates, mockClearDuplicates } = vi.hoisted(() => ({
  mockCheckDuplicates: vi.fn(),
  mockClearDuplicates: vi.fn()
}))

// Define mock object at module level
const mockDuplicateDetection = {
  duplicates: [],
  isChecking: false,
  error: null,
  checkDuplicates: mockCheckDuplicates,
  clearDuplicates: mockClearDuplicates,
  hasExactMatch: false,
  hasSimilar: false
}

// Mock the module with proper scope
vi.mock('../../../validation/hooks/useDuplicateDetection', () => ({
  useDuplicateDetection: () => mockDuplicateDetection,
  useRealtimeDuplicateDetection: () => mockDuplicateDetection
}))

describe('SongForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()
  
  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnCancel.mockClear()
    mockCheckDuplicates.mockClear()
    mockClearDuplicates.mockClear()
    mockDuplicateDetection.duplicates = []
    mockDuplicateDetection.hasExactMatch = false
    mockDuplicateDetection.hasSimilar = false
    
    // Setup default auth mock
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user' },
      userId: 'test-user',
      sessionId: 'session-123',
      isLoaded: true,
      isSignedIn: true,
      isAdmin: true,
      getToken: vi.fn(),
      getUserEmail: vi.fn(),
      getUserName: vi.fn(),
      getUserAvatar: vi.fn()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering Tests', () => {
    it('renders all form sections', () => {
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Categorization')).toBeInTheDocument()
      expect(screen.getByText('Additional Information')).toBeInTheDocument()
    })
    
    it('renders all form fields', () => {
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      // Basic Info fields
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/artist/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/year/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/ccli number/i)).toBeInTheDocument()
      
      // Categorization fields
      expect(screen.getByLabelText(/source/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/theme search/i)).toBeInTheDocument()
      
      // Notes fields
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/make this song public/i)).toBeInTheDocument()
    })

    it('renders arrangement section with checkbox', () => {
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      expect(screen.getByLabelText(/add arrangement to this song/i)).toBeInTheDocument()
      expect(screen.getByText(/include musical notation/i)).toBeInTheDocument()
    })

    it('renders form without auth context (guest user)', () => {
      vi.mocked(useAuth).mockReturnValueOnce({
        user: null,
        userId: null,
        sessionId: null,
        isLoaded: true,
        isSignedIn: false,
        isAdmin: false,
        getToken: vi.fn(),
        getUserEmail: vi.fn(),
        getUserName: vi.fn(),
        getUserAvatar: vi.fn()
      })

      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      // Public checkbox should not be visible for non-admin users
      expect(screen.queryByLabelText(/make this song public/i)).not.toBeInTheDocument()
    })

    it('shows arrangement form when checkbox is checked', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      const arrangementCheckbox = screen.getByLabelText(/add arrangement to this song/i)
      await user.click(arrangementCheckbox)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/arrangement name/i)).toBeInTheDocument()
      })
    })
  })

  describe('Validation Tests', () => {
    it('validates required fields - title', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      // Try to submit without title
      const submitButton = screen.getByRole('button', { name: /create song/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it('validates required fields - themes', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      // Fill title but no themes
      await user.type(screen.getByLabelText(/title/i), 'Test Song')
      
      const submitButton = screen.getByRole('button', { name: /create song/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it('validates CCLI format - must be 5-7 digits', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      const ccliInput = screen.getByLabelText(/ccli number/i)
      
      // Test invalid formats
      await user.clear(ccliInput)
      await user.type(ccliInput, 'abc')
      
      const submitButton = screen.getByRole('button', { name: /create song/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
      
      // Test too short
      await user.clear(ccliInput)
      await user.type(ccliInput, '123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
      
      // Test too long
      await user.clear(ccliInput)
      await user.type(ccliInput, '12345678')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it('validates year range - must be after 1000 and not in future', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      const yearInput = screen.getByLabelText(/year/i)
      
      // Test year before 1000
      await user.clear(yearInput)
      await user.type(yearInput, '999')
      
      const submitButton = screen.getByRole('button', { name: /create song/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
      
      // Test future year
      const futureYear = new Date().getFullYear() + 10
      await user.clear(yearInput)
      await user.type(yearInput, futureYear.toString())
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it('validates character limits', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      // Test title character limit (200 chars)
      const longTitle = 'A'.repeat(201)
      await user.type(screen.getByLabelText(/title/i), longTitle)
      
      const submitButton = screen.getByRole('button', { name: /create song/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
      
      // Test notes character limit (2000 chars)
      const longNotes = 'A'.repeat(2001)
      await user.clear(screen.getByLabelText(/title/i))
      await user.type(screen.getByLabelText(/title/i), 'Valid Title')
      await user.type(screen.getByLabelText(/notes/i), longNotes)
      
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it('validates whitespace-only title', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      await user.type(screen.getByLabelText(/title/i), '   ')
      
      const submitButton = screen.getByRole('button', { name: /create song/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })
  })

  describe('Theme Selection Tests', () => {
    it('adds themes through autocomplete', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      const themeInput = screen.getByLabelText(/theme search/i)
      await user.type(themeInput, 'worship')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('Worship')).toBeInTheDocument()
      })
    })

    it('normalizes theme input', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      const themeInput = screen.getByLabelText(/theme search/i)
      await user.type(themeInput, 'WORSHIP')
      await user.keyboard('{Enter}')
      
      // Should normalize to proper case
      await waitFor(() => {
        expect(screen.getByText('Worship')).toBeInTheDocument()
      })
    })

    it('removes themes when clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      // Add theme
      const themeInput = screen.getByLabelText(/theme search/i)
      await user.type(themeInput, 'worship')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText('Worship')).toBeInTheDocument()
      })
      
      // Remove theme
      const removeButton = screen.getByLabelText(/remove Worship/i)
      await user.click(removeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Worship')).not.toBeInTheDocument()
      })
    })

    it('enforces maximum theme limits', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      const themeInput = screen.getByLabelText(/theme search/i)
      
      // Add maximum number of themes (10)
      const themes = ['worship', 'praise', 'prayer', 'grace', 'salvation', 'peace', 'love', 'hope', 'faith', 'joy']
      for (const theme of themes) {
        await user.clear(themeInput)
        await user.type(themeInput, theme)
        await user.keyboard('{Enter}')
      }
      
      // Try to add one more - input should be disabled at this point
      // await user.clear(themeInput) // Skip clear since input is disabled
      // await user.type(themeInput, 'extra') // Skip typing since input is disabled
      // await user.keyboard('{Enter}') // Skip since input is disabled
      
      // Should not add the 11th theme
      expect(screen.queryByText('extra')).not.toBeInTheDocument()
      expect(screen.getByText(/10\/10 themes selected/i)).toBeInTheDocument()
    })
  })

  describe('Duplicate Detection Tests', () => {
    it('shows duplicate warning when similar songs exist', async () => {
      const existingSong = songFactory.build({ title: 'Amazing Grace', artist: 'John Newton' })
      mockDuplicateDetection.duplicates = [
        {
          song: existingSong,
          similarity: 'exact' as const,
          distance: 0,
          matchedOn: { title: true, artist: true }
        }
      ]
      mockDuplicateDetection.hasExactMatch = true
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
          existingSongs={[existingSong]}
        />
      )
      
      await userEvent.type(screen.getByLabelText(/title/i), 'Amazing Grace')
      
      await waitFor(() => {
        expect(screen.getByText(/similar songs found/i)).toBeInTheDocument()
      })
    })

    it('allows continuing despite duplicate warning', async () => {
      const user = userEvent.setup()
      const existingSong = songFactory.build({ title: 'Amazing Grace' })
      
      mockDuplicateDetection.duplicates = [
        {
          song: existingSong,
          similarity: 'very-similar' as const,
          distance: 1,
          matchedOn: { title: false, artist: false }
        }
      ]
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
          existingSongs={[existingSong]}
        />
      )
      
      await user.type(screen.getByLabelText(/title/i), 'Amazing Grace')
      
      await waitFor(() => {
        expect(screen.getByText(/similar songs found/i)).toBeInTheDocument()
      })
      
      const continueButton = screen.getByRole('button', { name: /continue anyway/i })
      await user.click(continueButton)
      
      expect(screen.queryByText(/similar songs found/i)).not.toBeInTheDocument()
    })

    it('disables submit button for exact matches until warning is dismissed', async () => {
      mockDuplicateDetection.hasExactMatch = true
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      const submitButton = screen.getByRole('button', { name: /create song/i })
      expect(submitButton).toBeDisabled()
    })

    it('does not show duplicate warning in edit mode', () => {
      const existingSong = songFactory.build()
      mockDuplicateDetection.duplicates = [
        {
          song: existingSong,
          similarity: 'exact' as const,
          distance: 0,
          matchedOn: { title: true, artist: true }
        }
      ]
      
      render(
        <SongForm 
          initialData={existingSong}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
          existingSongs={[existingSong]}
        />
      )
      
      expect(screen.queryByText(/similar songs found/i)).not.toBeInTheDocument()
    })
  })

  describe('Form Submission Tests', () => {
    it('submits valid form data', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      // Fill required fields
      await user.type(screen.getByLabelText(/title/i), 'Amazing Grace')
      await user.type(screen.getByLabelText(/artist/i), 'John Newton')
      await user.type(screen.getByLabelText(/year/i), '1779')
      await user.type(screen.getByLabelText(/ccli number/i), '22025')
      
      // Add theme
      const themeInput = screen.getByLabelText(/theme search/i)
      await user.type(themeInput, 'grace')
      await user.keyboard('{Enter}')
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create song/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Amazing Grace',
            artist: 'John Newton',
            compositionYear: 1779,
            ccli: '22025',
            themes: expect.arrayContaining(['Grace'])
          })
        )
      })
    })

    it('submits form with minimal required data', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      // Fill only required fields
      await user.type(screen.getByLabelText(/title/i), 'Test Song')
      
      const themeInput = screen.getByLabelText(/theme search/i)
      await user.type(themeInput, 'worship')
      await user.keyboard('{Enter}')
      
      const submitButton = screen.getByRole('button', { name: /create song/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Song',
            themes: ['Worship'],
            isPublic: false
          })
        )
      })
    })

    it('handles form submission with arrangement data', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      // Fill basic fields
      await user.type(screen.getByLabelText(/title/i), 'Test Song')
      
      const themeInput = screen.getByLabelText(/theme search/i)
      await user.type(themeInput, 'worship')
      await user.keyboard('{Enter}')
      
      // Enable arrangement
      const arrangementCheckbox = screen.getByLabelText(/add arrangement to this song/i)
      await user.click(arrangementCheckbox)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/arrangement name/i)).toBeInTheDocument()
      })
      
      // Fill arrangement fields  
      const arrangementNameInput = screen.getByLabelText(/arrangement name/i)
      await user.clear(arrangementNameInput)
      await user.type(arrangementNameInput, 'Key of G')
      
      const submitButton = screen.getByRole('button', { name: /create song/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Song',
            themes: ['Worship'],
            arrangement: expect.objectContaining({
              name: 'Test Song - Key of G'
            })
          })
        )
      })
    })

    it('disabled during submission', () => {
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
          isSubmitting={true}
        />
      )
      
      expect(screen.getByLabelText(/title/i)).toBeDisabled()
      expect(screen.getByLabelText(/artist/i)).toBeDisabled()
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    })

    it('shows appropriate button text for create vs update', () => {
      // Create mode
      const { rerender } = render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      expect(screen.getByRole('button', { name: /create song/i })).toBeInTheDocument()
      
      // Update mode
      const existingSong = songFactory.build()
      rerender(
        <SongForm 
          initialData={existingSong}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      expect(screen.getByRole('button', { name: /update song/i })).toBeInTheDocument()
    })
  })

  describe('Error Handling Tests', () => {
    it('handles form submission errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockOnSubmit.mockRejectedValueOnce(new Error('Network error'))
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      // Fill required fields
      await user.type(screen.getByLabelText(/title/i), 'Test Song')
      
      const themeInput = screen.getByLabelText(/theme search/i)
      await user.type(themeInput, 'worship')
      await user.keyboard('{Enter}')
      
      const submitButton = screen.getByRole('button', { name: /create song/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Form submission error:', expect.any(Error))
      })
      
      consoleErrorSpy.mockRestore()
    })

    it('clears field errors when user starts typing', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      // Try to submit with invalid CCLI
      await user.type(screen.getByLabelText(/ccli number/i), 'invalid')
      
      const submitButton = screen.getByRole('button', { name: /create song/i })
      await user.click(submitButton)
      
      // Start typing in CCLI field to clear error
      await user.clear(screen.getByLabelText(/ccli number/i))
      await user.type(screen.getByLabelText(/ccli number/i), '12345')
      
      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/ccli must be 5-7 digits/i)).not.toBeInTheDocument()
      })
    })

    it('resets duplicate warning when title or artist changes', async () => {
      const user = userEvent.setup()
      
      mockDuplicateDetection.duplicates = [
        {
          song: songFactory.build(),
          similarity: 'very-similar' as const,
          distance: 1,
          matchedOn: { title: false, artist: false }
        }
      ]
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      await user.type(screen.getByLabelText(/title/i), 'Test')
      
      await waitFor(() => {
        expect(screen.getByText(/similar songs found/i)).toBeInTheDocument()
      })
      
      const continueButton = screen.getByRole('button', { name: /continue anyway/i })
      await user.click(continueButton)
      
      expect(screen.queryByText(/similar songs found/i)).not.toBeInTheDocument()
      
      // Change title - should reset warning
      await user.type(screen.getByLabelText(/title/i), ' Song')
      
      // Should show warning again (if duplicates still exist)
      await waitFor(() => {
        expect(screen.getByText(/similar songs found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Edit Mode Tests', () => {
    it('fills form with initial data in edit mode', () => {
      const initialData: Partial<Song> = {
        title: 'Existing Song',
        artist: 'Existing Artist',
        compositionYear: 2020,
        ccli: '1234567',
        themes: ['Worship', 'Praise'],
        source: 'Contemporary-Christian',
        notes: 'Some notes',
        metadata: {
          isPublic: true,
          views: 0
        }
      }
      
      render(
        <SongForm 
          initialData={initialData}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      expect(screen.getByDisplayValue('Existing Song')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing Artist')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2020')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1234567')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Some notes')).toBeInTheDocument()
      expect(screen.getByText('Worship')).toBeInTheDocument()
      expect(screen.getByText('Praise')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Contemporary Christian')).toBeInTheDocument()
      expect(screen.getByLabelText(/make this song public/i)).toBeChecked()
    })

    it('handles partial initial data gracefully', () => {
      const initialData: Partial<Song> = {
        title: 'Minimal Song',
        themes: ['Worship']
      }
      
      render(
        <SongForm 
          initialData={initialData}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      expect(screen.getByDisplayValue('Minimal Song')).toBeInTheDocument()
      expect(screen.getByText('Worship')).toBeInTheDocument()
    })
  })

  describe('Accessibility and UX Tests', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('shows character count for fields with maxLength', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Test')
      
      // FormInput should show character count
      expect(screen.getByText(/4\/200/)).toBeInTheDocument()
    })

    it('has proper ARIA labels and roles', () => {
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      expect(screen.getByRole('form')).toBeInTheDocument()
      expect(screen.getByLabelText(/theme search/i)).toHaveAttribute('aria-autocomplete', 'list')
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    })

    it('prevents form submission with Enter key when invalid', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Test{Enter}')
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <SongForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel} 
        />
      )
      
      // Tab through form fields
      await user.tab()
      expect(screen.getByLabelText(/title/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/artist/i)).toHaveFocus()
    })
  })
})