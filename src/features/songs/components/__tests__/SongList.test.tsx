import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SongList } from '../SongList'
import type { Song } from '../../types/song.types'

// Mock the SongCard component
vi.mock('../SongCard', () => ({
  SongCard: ({ song, onClick }: { song: Song, onClick?: (song: Song) => void }) => (
    <div 
      data-testid={`song-card-${song.id}`}
      onClick={() => onClick?.(song)}
    >
      <h3>{song.title}</h3>
      <p>{song.artist}</p>
    </div>
  )
}))

describe('SongList', () => {
  const mockSongs: Song[] = [
    {
      id: 'song-1',
      title: 'Amazing Grace',
      artist: 'John Newton',
      slug: 'amazing-grace',
      themes: ['Grace', 'Salvation'],
      metadata: {
        isPublic: true,
        views: 100
      }
    },
    {
      id: 'song-2',
      title: 'How Great Thou Art',
      artist: 'Carl Boberg',
      slug: 'how-great-thou-art',
      themes: ['Worship', 'Creation'],
      metadata: {
        isPublic: true,
        views: 150
      }
    },
    {
      id: 'song-3',
      title: 'Be Thou My Vision',
      artist: 'Traditional',
      slug: 'be-thou-my-vision',
      themes: ['Devotion', 'Trust'],
      metadata: {
        isPublic: true,
        views: 75
      }
    }
  ]

  it('renders loading state correctly', () => {
    render(<SongList songs={[]} loading={true} />)
    
    expect(screen.getByText('Loading songs...')).toBeInTheDocument()
    expect(screen.queryByTestId(/song-card/)).not.toBeInTheDocument()
  })

  it('renders error state correctly', () => {
    const errorMessage = 'Failed to load songs'
    render(<SongList songs={[]} loading={false} error={errorMessage} />)
    
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument()
    expect(screen.queryByTestId(/song-card/)).not.toBeInTheDocument()
    expect(screen.queryByText('Loading songs...')).not.toBeInTheDocument()
  })

  it('renders empty state when no songs provided', () => {
    render(<SongList songs={[]} loading={false} />)
    
    expect(screen.getByText('No songs found')).toBeInTheDocument()
    expect(screen.queryByTestId(/song-card/)).not.toBeInTheDocument()
  })

  it('renders empty state when songs array is undefined', () => {
    render(<SongList songs={undefined as any} loading={false} />)
    
    expect(screen.getByText('No songs found')).toBeInTheDocument()
    expect(screen.queryByTestId(/song-card/)).not.toBeInTheDocument()
  })

  it('renders list of songs correctly', () => {
    render(<SongList songs={mockSongs} loading={false} />)
    
    mockSongs.forEach(song => {
      expect(screen.getByTestId(`song-card-${song.id}`)).toBeInTheDocument()
      expect(screen.getByText(song.title)).toBeInTheDocument()
      expect(screen.getByText(song.artist)).toBeInTheDocument()
    })
    
    expect(screen.queryByText('Loading songs...')).not.toBeInTheDocument()
    expect(screen.queryByText('No songs found')).not.toBeInTheDocument()
  })

  it('calls onSongClick when a song is clicked', async () => {
    const user = userEvent.setup()
    const mockOnSongClick = vi.fn()
    
    render(<SongList songs={mockSongs} loading={false} onSongClick={mockOnSongClick} />)
    
    const firstSongCard = screen.getByTestId(`song-card-${mockSongs[0].id}`)
    await user.click(firstSongCard)
    
    expect(mockOnSongClick).toHaveBeenCalledWith(mockSongs[0])
    expect(mockOnSongClick).toHaveBeenCalledTimes(1)
  })

  it('renders correct number of song cards', () => {
    render(<SongList songs={mockSongs} loading={false} />)
    
    const songCards = screen.getAllByTestId(/song-card/)
    expect(songCards).toHaveLength(mockSongs.length)
  })

  it('does not render songs when in loading state', () => {
    render(<SongList songs={mockSongs} loading={true} />)
    
    expect(screen.getByText('Loading songs...')).toBeInTheDocument()
    expect(screen.queryByTestId(/song-card/)).not.toBeInTheDocument()
  })

  it('does not render songs when in error state', () => {
    render(<SongList songs={mockSongs} loading={false} error="Some error" />)
    
    expect(screen.getByText('Error: Some error')).toBeInTheDocument()
    expect(screen.queryByTestId(/song-card/)).not.toBeInTheDocument()
  })

  it('passes onSongClick handler to each SongCard', () => {
    const mockOnSongClick = vi.fn()
    
    render(<SongList songs={mockSongs} loading={false} onSongClick={mockOnSongClick} />)
    
    // Verify all song cards are rendered (they should all have the onClick handler)
    mockSongs.forEach(song => {
      expect(screen.getByTestId(`song-card-${song.id}`)).toBeInTheDocument()
    })
  })

  it('handles single song in array', () => {
    const singleSong = [mockSongs[0]]
    
    render(<SongList songs={singleSong} loading={false} />)
    
    expect(screen.getByTestId(`song-card-${singleSong[0].id}`)).toBeInTheDocument()
    expect(screen.getAllByTestId(/song-card/)).toHaveLength(1)
  })

  it('prioritizes loading state over error state', () => {
    render(<SongList songs={mockSongs} loading={true} error="Network error" />)
    
    expect(screen.getByText('Loading songs...')).toBeInTheDocument()
    expect(screen.queryByText('Error: Network error')).not.toBeInTheDocument()
  })

  it('applies correct grid styles to the container', () => {
    render(<SongList songs={mockSongs} loading={false} />)
    
    const gridContainer = screen.getByTestId(`song-card-${mockSongs[0].id}`).parentElement
    expect(gridContainer).toHaveStyle({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1rem',
      padding: '1rem'
    })
  })
})