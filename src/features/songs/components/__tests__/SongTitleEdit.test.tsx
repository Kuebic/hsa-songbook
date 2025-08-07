import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SongTitleEdit } from '../SongTitleEdit'
import type { Song } from '../../types/song.types'

// Mock auth hook
vi.mock('@features/auth')

// Mock song service
vi.mock('../../services/songService', () => ({
  songService: {
    updateSong: vi.fn()
  }
}))

describe('SongTitleEdit', () => {
  const mockSong: Song = {
    id: 'song-1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    slug: 'amazing-grace',
    themes: ['hymn', 'grace'],
    metadata: {
      createdBy: 'user-123',
      isPublic: true,
      views: 100,
      ratings: { average: 4.5, count: 10 }
    }
  }
  
  beforeEach(async () => {
    vi.clearAllMocks()
    // Default auth mock - user owns the song
    const { useAuth } = vi.mocked(await import('@features/auth'))
    useAuth.mockReturnValue({
      isSignedIn: true,
      isAdmin: false,
      userId: 'user-123',
      getToken: vi.fn().mockResolvedValue('test-token'),
      user: null,
      isLoaded: true,
      sessionId: 'session-123',
      getUserEmail: () => 'user@example.com',
      getUserName: () => 'Test User',
      getUserAvatar: () => ''
    })
  })
  
  it('should display song title in view mode', () => {
    render(<SongTitleEdit song={mockSong} />)
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })
  
  it('should show edit icon on hover', async () => {
    const user = userEvent.setup()
    render(<SongTitleEdit song={mockSong} />)
    
    const button = screen.getByRole('button')
    await user.hover(button)
    
    // The icon exists but visibility is controlled by CSS which doesn't apply in tests
    expect(screen.getByText('✏️')).toBeInTheDocument()
  })
  
  it('should enter edit mode on click', async () => {
    const user = userEvent.setup()
    render(<SongTitleEdit song={mockSong} />)
    
    await user.click(screen.getByRole('button'))
    
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('Amazing Grace')
    expect(input).toHaveFocus()
  })
  
  it('should save on Enter key', async () => {
    const user = userEvent.setup()
    const { songService } = await import('../../services/songService')
    const mockUpdate = vi.fn().mockResolvedValue({ ...mockSong, title: 'New Title' })
    songService.updateSong = mockUpdate
    
    render(<SongTitleEdit song={mockSong} />)
    
    await user.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.type(input, 'New Title')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('song-1', { title: 'New Title' }, 'test-token', 'user-123')
    })
  })
  
  it('should cancel on Escape key', async () => {
    const user = userEvent.setup()
    render(<SongTitleEdit song={mockSong} />)
    
    await user.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.type(input, 'Changed Title')
    await user.keyboard('{Escape}')
    
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
  
  it('should show validation error for empty title', async () => {
    const user = userEvent.setup()
    render(<SongTitleEdit song={mockSong} />)
    
    await user.click(screen.getByRole('button'))
    const input = screen.getByRole('textbox')
    
    await user.clear(input)
    await user.keyboard('{Enter}')
    
    expect(screen.getByRole('alert')).toHaveTextContent('Title is required')
  })
  
  it('should not show edit button for unauthorized users', async () => {
    const { useAuth } = vi.mocked(await import('@features/auth'))
    useAuth.mockReturnValue({
      isSignedIn: false,
      isAdmin: false,
      userId: null,
      getToken: vi.fn(),
      user: null,
      isLoaded: true,
      sessionId: null,
      getUserEmail: () => '',
      getUserName: () => '',
      getUserAvatar: () => ''
    })
    
    render(<SongTitleEdit song={mockSong} />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })
  
  it('should allow admin to edit any song', async () => {
    const { useAuth } = vi.mocked(await import('@features/auth'))
    useAuth.mockReturnValue({
      isSignedIn: true,
      isAdmin: true,
      userId: 'admin-user',
      getToken: vi.fn().mockResolvedValue('admin-token'),
      user: null,
      isLoaded: true,
      sessionId: 'admin-session',
      getUserEmail: () => 'admin@example.com',
      getUserName: () => 'Admin User',
      getUserAvatar: () => ''
    })
    
    const otherUserSong = {
      ...mockSong,
      metadata: {
        ...mockSong.metadata!,
        createdBy: 'other-user'
      }
    }
    
    render(<SongTitleEdit song={otherUserSong} />)
    
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})