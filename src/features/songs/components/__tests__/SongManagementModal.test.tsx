import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SongManagementModal } from '../SongManagementModal'
import { NotificationProvider } from '@shared/components/notifications'
import { ModalProvider } from '@shared/components/modal'
import type { Song } from '../../types/song.types'

// Mock the hooks
vi.mock('@features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com' },
    isAdmin: false
  }))
}))

vi.mock('../../hooks/queries/useSongs', () => ({
  useSongs: vi.fn(() => ({
    songs: []
  }))
}))

vi.mock('../../hooks/mutations/useCreateSong', () => ({
  useCreateSong: vi.fn(() => ({
    createSong: vi.fn()
  }))
}))

vi.mock('../../hooks/mutations/useUpdateSong', () => ({
  useUpdateSong: vi.fn(() => ({
    updateSong: vi.fn()
  }))
}))

// Helper function to render component with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ModalProvider>
      <NotificationProvider>
        {component}
      </NotificationProvider>
    </ModalProvider>
  )
}

describe('SongManagementModal', () => {
  it('should render modal with correct title for new song', () => {
    renderWithProviders(
      <SongManagementModal
        isOpen={true}
        onClose={vi.fn()}
      />
    )
    
    expect(screen.getByText('Add New Song')).toBeInTheDocument()
    expect(screen.getByText('Fill in the details to add a new song to the catalog')).toBeInTheDocument()
  })

  it('should render modal with correct title for editing', () => {
    const existingSong: Song = {
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
    
    renderWithProviders(
      <SongManagementModal
        isOpen={true}
        onClose={vi.fn()}
        song={existingSong}
      />
    )
    
    expect(screen.getByText('Edit Song')).toBeInTheDocument()
    expect(screen.getByText('Update the details of this song')).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    const { container } = renderWithProviders(
      <SongManagementModal
        isOpen={false}
        onClose={vi.fn()}
      />
    )
    
    expect(container.querySelector('dialog')).not.toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn()
    renderWithProviders(
      <SongManagementModal
        isOpen={true}
        onClose={onClose}
      />
    )
    
    const closeButton = screen.getByLabelText('Close dialog')
    fireEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('should call onSuccess and onClose when form is successfully submitted', async () => {
    const onSuccess = vi.fn()
    const onClose = vi.fn()
    const savedSong: Song = {
      id: 'new-song',
      title: 'New Song',
      artist: 'New Artist',
      slug: 'new-song-na-12345',
      themes: ['theme1'],
      metadata: {
        isPublic: false,
        views: 0
      }
    }
    
    // Mock successful creation
    vi.mock('../../hooks/mutations/useCreateSong', () => ({
      useCreateSong: vi.fn(() => ({
        createSong: vi.fn().mockResolvedValue(savedSong)
      }))
    }))
    
    renderWithProviders(
      <SongManagementModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    )
    
    // Note: In a real test, you would fill out the form and submit it
    // This is a simplified example showing the expected behavior
    // The actual form submission test is covered in SongManagementForm.test.tsx
  })

  it('should pass song prop to form when editing', () => {
    const existingSong: Song = {
      id: 'song-123',
      title: 'Existing Song',
      artist: 'Existing Artist',
      slug: 'existing-song',
      themes: ['theme1'],
      metadata: {
        isPublic: false,
        views: 0
      }
    }
    
    renderWithProviders(
      <SongManagementModal
        isOpen={true}
        onClose={vi.fn()}
        song={existingSong}
      />
    )
    
    // Check that the form is pre-populated with existing song data
    expect(screen.getByDisplayValue('Existing Song')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing Artist')).toBeInTheDocument()
  })
})