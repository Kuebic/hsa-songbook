import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@shared/test-utils/testWrapper'
import userEvent from '@testing-library/user-event'
import { SongActions } from '../SongActions'
import type { TestUser } from '@shared/types/test'

// Mock dependencies  
vi.mock('@features/auth/hooks/useAuth')
vi.mock('@features/songs/hooks/mutations/useSongMutations')

import { useAuth } from '@features/auth/hooks/useAuth'
import { useSongMutations } from '@features/songs/hooks/mutations/useSongMutations'

const mockUseAuth = vi.mocked(useAuth)
const mockUseSongMutations = vi.mocked(useSongMutations)
const mockUpdateSong = vi.fn()
const mockDeleteSong = vi.fn()
const mockOnUpdate = vi.fn()
const mockOnDelete = vi.fn()

interface SongFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

// Mock SongFormModal
vi.mock('../../forms/SongFormModal', () => ({
  SongFormModal: ({ isOpen, onClose, onSubmit }: SongFormModalProps) => (
    isOpen ? (
      <div role="dialog">
        <h2>Edit Song</h2>
        <button onClick={onClose}>Close</button>
        <button onClick={() => onSubmit({ title: 'Updated Song', themes: ['test'] })}>
          Update Song
        </button>
      </div>
    ) : null
  )
}))

const mockSong = {
  id: '123',
  title: 'Test Song',
  artist: 'Test Artist',
  slug: 'test-song',
  themes: ['test'],
  metadata: {
    createdBy: 'test-user',
    isPublic: false,
    views: 0,
    ratings: { average: 0, count: 0 }
  }
}


describe('SongActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default mock implementations
    mockUseSongMutations.mockReturnValue({
      createSong: vi.fn(),
      updateSong: mockUpdateSong,
      updateSongTitle: vi.fn(),
      updateSongField: vi.fn(),
      deleteSong: mockDeleteSong,
      rateSong: vi.fn(),
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      isRating: false,
      error: null,
      optimisticSongs: [],
      clearError: vi.fn(),
      isAuthenticated: false
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not render when user cannot edit or delete', () => {
    mockUseAuth.mockReturnValue({
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

    render(<SongActions song={mockSong} />)
    
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('shows edit and delete buttons for song owner', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' } as TestUser,
      userId: 'test-user',
      sessionId: 'session-123',
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      getToken: vi.fn(),
      getUserEmail: vi.fn(),
      getUserName: vi.fn(),
      getUserAvatar: vi.fn()
    })

    render(<SongActions song={mockSong} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    
    expect(screen.getByRole('button', { name: /edit test song/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete test song/i })).toBeInTheDocument()
  })

  it('shows edit and delete buttons for admin even if not owner', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'other-user', email: 'other@example.com' } as TestUser,
      userId: 'other-user',
      sessionId: 'session-456',
      isLoaded: true,
      isSignedIn: true,
      isAdmin: true,
      getToken: vi.fn(),
      getUserEmail: vi.fn(),
      getUserName: vi.fn(),
      getUserAvatar: vi.fn()
    })

    render(<SongActions song={mockSong} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    
    expect(screen.getByRole('button', { name: /edit test song/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete test song/i })).toBeInTheDocument()
  })

  it('does not show buttons for non-owner, non-admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'other-user', email: 'other@example.com' } as TestUser,
      userId: 'other-user',
      sessionId: 'session-456',
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      getToken: vi.fn(),
      getUserEmail: vi.fn(),
      getUserName: vi.fn(),
      getUserAvatar: vi.fn()
    })

    render(<SongActions song={mockSong} />)
    
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('opens edit modal when edit button is clicked', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' } as TestUser,
      userId: 'test-user',
      sessionId: 'session-123',
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      getToken: vi.fn(),
      getUserEmail: vi.fn(),
      getUserName: vi.fn(),
      getUserAvatar: vi.fn()
    })

    render(<SongActions song={mockSong} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    
    await user.click(screen.getByRole('button', { name: /edit test song/i }))
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Edit Song')).toBeInTheDocument()
    })
  })

  it('shows delete confirmation dialog when delete button is clicked', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' } as TestUser,
      userId: 'test-user',
      sessionId: 'session-123',
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      getToken: vi.fn(),
      getUserEmail: vi.fn(),
      getUserName: vi.fn(),
      getUserAvatar: vi.fn()
    })

    render(<SongActions song={mockSong} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    
    await user.click(screen.getByRole('button', { name: /delete test song/i }))
    
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument()
      expect(screen.getByText(/test song/i)).toBeInTheDocument()
    })
  })

  it('calls updateSong when edit form is submitted', async () => {
    const user = userEvent.setup()
    const updatedSong = { ...mockSong, title: 'Updated Song' }
    
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' } as TestUser,
      userId: 'test-user',
      sessionId: 'session-123',
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      getToken: vi.fn(),
      getUserEmail: vi.fn(),
      getUserName: vi.fn(),
      getUserAvatar: vi.fn()
    })

    mockUpdateSong.mockResolvedValue(updatedSong)

    render(<SongActions song={mockSong} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    
    // Open edit modal and submit
    await user.click(screen.getByRole('button', { name: /edit test song/i }))
    await user.click(screen.getByText('Update Song'))
    
    await waitFor(() => {
      expect(mockUpdateSong).toHaveBeenCalledWith('123', { title: 'Updated Song', themes: ['test'] })
      expect(mockOnUpdate).toHaveBeenCalledWith(updatedSong)
    })
  })

  it('calls deleteSong when delete is confirmed', async () => {
    const user = userEvent.setup()
    
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' } as TestUser,
      userId: 'test-user',
      sessionId: 'session-123',
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      getToken: vi.fn(),
      getUserEmail: vi.fn(),
      getUserName: vi.fn(),
      getUserAvatar: vi.fn()
    })

    mockDeleteSong.mockResolvedValue(undefined)

    render(<SongActions song={mockSong} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    
    // Open delete confirmation and confirm
    await user.click(screen.getByRole('button', { name: /delete test song/i }))
    
    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByText('Delete'))
    
    await waitFor(() => {
      expect(mockDeleteSong).toHaveBeenCalledWith('123')
      expect(mockOnDelete).toHaveBeenCalledWith('123')
    })
  })

  it('cancels delete when cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' } as TestUser,
      userId: 'test-user',
      sessionId: 'session-123',
      isLoaded: true,
      isSignedIn: true,
      isAdmin: false,
      getToken: vi.fn(),
      getUserEmail: vi.fn(),
      getUserName: vi.fn(),
      getUserAvatar: vi.fn()
    })

    render(<SongActions song={mockSong} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />)
    
    // Open delete confirmation and cancel
    await user.click(screen.getByRole('button', { name: /delete test song/i }))
    
    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByText('Cancel'))
    
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(mockDeleteSong).not.toHaveBeenCalled()
      expect(mockOnDelete).not.toHaveBeenCalled()
    })
  })
})