import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddSongButton } from '../AddSongButton'
import { NotificationProvider } from '@shared/components/notifications'

// Mock dependencies  
vi.mock('@features/auth/hooks/useAuth')
vi.mock('@features/songs/hooks/mutations/useSongMutations')

import { useAuth } from '@features/auth/hooks/useAuth'
import { useSongMutations } from '@features/songs/hooks/mutations/useSongMutations'

const mockUseAuth = vi.mocked(useAuth)
const mockUseSongMutations = vi.mocked(useSongMutations)
const mockCreateSong = vi.fn()

// Mock SongFormModal since we're testing the button, not the modal
vi.mock('../../forms/SongFormModal', () => ({
  SongFormModal: ({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (data: Record<string, unknown>) => void }) => (
    isOpen ? (
      <div role="dialog" data-testid="song-form-modal">
        <h2>Add New Song</h2>
        <button onClick={onClose} aria-label="Close dialog">Close</button>
        <button onClick={() => onSubmit({ title: 'Test Song', themes: ['test'] })}>
          Create Song
        </button>
      </div>
    ) : null
  )
}))

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  )
}

describe('AddSongButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default mock implementations
    mockUseSongMutations.mockReturnValue({
      createSong: mockCreateSong,
      updateSong: vi.fn(),
      updateSongTitle: vi.fn(),
      updateSongField: vi.fn(),
      deleteSong: vi.fn(),
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

  it('does not render when user is not signed in', () => {
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

    render(
      <TestWrapper>
        <AddSongButton />
      </TestWrapper>
    )
    
    expect(screen.queryByRole('button', { name: /add new song/i })).not.toBeInTheDocument()
  })

  it('renders when user is signed in', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user' } as any,
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

    render(
      <TestWrapper>
        <AddSongButton />
      </TestWrapper>
    )
    
    expect(screen.getByRole('button', { name: /add new song/i })).toBeInTheDocument()
    expect(screen.getByText('Add Song')).toBeInTheDocument()
    expect(screen.getByText('➕')).toBeInTheDocument()
  })

  it('should not show modal initially', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user' } as any,
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

    render(
      <TestWrapper>
        <AddSongButton />
      </TestWrapper>
    )
    
    expect(screen.queryByTestId('song-form-modal')).not.toBeInTheDocument()
  })

  it('should show modal when button clicked', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user' } as any,
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

    render(
      <TestWrapper>
        <AddSongButton />
      </TestWrapper>
    )
    
    const button = screen.getByTestId('add-song-button')
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByTestId('song-form-modal')).toBeInTheDocument()
    })
  })

  it('should hide modal when close button clicked', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user' } as any,
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

    render(
      <TestWrapper>
        <AddSongButton />
      </TestWrapper>
    )
    
    const button = screen.getByTestId('add-song-button')
    await user.click(button)
    
    const closeButton = await screen.findByLabelText('Close dialog')
    await user.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByTestId('song-form-modal')).not.toBeInTheDocument()
    })
  })

  it('opens modal when clicked', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user' } as any,
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

    render(
      <TestWrapper>
        <AddSongButton />
      </TestWrapper>
    )
    
    await user.click(screen.getByRole('button', { name: /add new song/i }))
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Add New Song')).toBeInTheDocument()
    })
  })

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user' } as any,
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

    render(
      <TestWrapper>
        <AddSongButton />
      </TestWrapper>
    )
    
    // Open modal
    await user.click(screen.getByRole('button', { name: /add new song/i }))
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Close modal
    await user.click(screen.getByText('Close'))
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('calls createSong when form is submitted successfully', async () => {
    const user = userEvent.setup()
    const mockSong = { id: '123', title: 'Test Song', slug: 'test-song' }
    
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user' } as any,
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

    mockCreateSong.mockResolvedValue(mockSong)

    render(
      <TestWrapper>
        <AddSongButton />
      </TestWrapper>
    )
    
    // Open modal and submit
    await user.click(screen.getByRole('button', { name: /add new song/i }))
    await user.click(screen.getByText('Create Song'))
    
    await waitFor(() => {
      expect(mockCreateSong).toHaveBeenCalledWith({ title: 'Test Song', themes: ['test'] })
    })

    // Modal should close after success
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('handles createSong error gracefully', async () => {
    const user = userEvent.setup()
    const mockError = new Error('Failed to create song')
    
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user' } as any,
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

    mockCreateSong.mockRejectedValue(mockError)

    render(
      <TestWrapper>
        <AddSongButton />
      </TestWrapper>
    )
    
    // Open modal and submit
    await user.click(screen.getByRole('button', { name: /add new song/i }))
    await user.click(screen.getByText('Create Song'))
    
    await waitFor(() => {
      expect(mockCreateSong).toHaveBeenCalled()
    })

    // Modal should still be open after error
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})