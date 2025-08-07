import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SearchResults } from '../SearchResults'
import type { Song } from '@features/songs'

// Mock the SongList component
vi.mock('@features/songs', () => ({
  SongList: ({ songs, loading, error, onSongClick }: {
    songs: Song[],
    loading: boolean,
    error: string | null,
    onSongClick?: (song: Song) => void
  }) => (
    <div data-testid="song-list">
      <div data-testid="song-list-props">
        {JSON.stringify({ songsCount: songs?.length || 0, loading, error, hasOnClick: !!onSongClick })}
      </div>
      {songs?.map(song => (
        <div key={song.id} data-testid={`mocked-song-${song.id}`}>
          {song.title}
        </div>
      ))}
    </div>
  )
}))

describe('SearchResults', () => {
  const mockSongs: Song[] = [
    {
      id: 'song-1',
      title: 'Amazing Grace',
      artist: 'John Newton',
      slug: 'amazing-grace',
      themes: ['Grace'],
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
      themes: ['Worship'],
      metadata: {
        isPublic: true,
        views: 150
      }
    }
  ]

  const defaultProps = {
    results: [],
    loading: false,
    error: null,
    query: '',
    onSongClick: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no query is provided', () => {
    render(<SearchResults {...defaultProps} query="" />)
    
    expect(screen.getByText('Enter a search term to find songs')).toBeInTheDocument()
    expect(screen.queryByTestId('song-list')).not.toBeInTheDocument()
  })

  it('does not render SongList when no query is provided', () => {
    render(<SearchResults {...defaultProps} query="" />)
    
    expect(screen.queryByTestId('song-list')).not.toBeInTheDocument()
  })

  it('renders search results with query', () => {
    render(<SearchResults {...defaultProps} results={mockSongs} query="grace" />)
    
    expect(screen.getByText((content, node) => {
      return node?.textContent === 'Found 2 songs for "grace"'
    })).toBeInTheDocument()
    expect(screen.getByTestId('song-list')).toBeInTheDocument()
  })

  it('shows loading state correctly', () => {
    render(<SearchResults {...defaultProps} loading={true} query="grace" />)
    
    expect(screen.getByText('Searching...')).toBeInTheDocument()
    expect(screen.queryByText(/Found \d+ songs/)).not.toBeInTheDocument()
  })

  it('displays correct count with singular song', () => {
    const singleSong = [mockSongs[0]]
    render(<SearchResults {...defaultProps} results={singleSong} query="amazing" />)
    
    expect(screen.getByText((content, node) => {
      return node?.textContent === 'Found 1 song for "amazing"'
    })).toBeInTheDocument()
  })

  it('displays correct count with multiple songs', () => {
    render(<SearchResults {...defaultProps} results={mockSongs} query="hymns" />)
    
    expect(screen.getByText((content, node) => {
      return node?.textContent === 'Found 2 songs for "hymns"'
    })).toBeInTheDocument()
  })

  it('displays count without query when query is provided', () => {
    render(<SearchResults {...defaultProps} results={mockSongs} query="" />)
    
    // When query is empty, should show empty state instead
    expect(screen.getByText('Enter a search term to find songs')).toBeInTheDocument()
  })

  it('passes correct props to SongList component', () => {
    const mockOnSongClick = vi.fn()
    render(
      <SearchResults 
        results={mockSongs} 
        loading={false} 
        error={null} 
        query="grace" 
        onSongClick={mockOnSongClick}
      />
    )
    
    const propsElement = screen.getByTestId('song-list-props')
    const props = JSON.parse(propsElement.textContent || '{}')
    
    expect(props.songsCount).toBe(2)
    expect(props.loading).toBe(false)
    expect(props.error).toBe(null)
    expect(props.hasOnClick).toBe(true)
  })

  it('passes loading state to SongList', () => {
    render(<SearchResults {...defaultProps} results={[]} loading={true} query="test" />)
    
    const propsElement = screen.getByTestId('song-list-props')
    const props = JSON.parse(propsElement.textContent || '{}')
    
    expect(props.loading).toBe(true)
  })

  it('passes error state to SongList', () => {
    const error = 'Network connection failed'
    render(<SearchResults {...defaultProps} results={[]} error={error} query="test" />)
    
    const propsElement = screen.getByTestId('song-list-props')
    const props = JSON.parse(propsElement.textContent || '{}')
    
    expect(props.error).toBe(error)
  })

  it('passes onSongClick handler to SongList', () => {
    const mockOnSongClick = vi.fn()
    render(<SearchResults {...defaultProps} onSongClick={mockOnSongClick} query="test" />)
    
    const propsElement = screen.getByTestId('song-list-props')
    const props = JSON.parse(propsElement.textContent || '{}')
    
    expect(props.hasOnClick).toBe(true)
  })

  it('handles undefined onSongClick', () => {
    render(<SearchResults {...defaultProps} onSongClick={undefined} query="test" />)
    
    const propsElement = screen.getByTestId('song-list-props')
    const props = JSON.parse(propsElement.textContent || '{}')
    
    expect(props.hasOnClick).toBe(false)
  })

  it('renders both header and SongList when query is provided', () => {
    render(<SearchResults {...defaultProps} results={mockSongs} query="test" />)
    
    // Header section
    expect(screen.getByText((content, node) => {
      return node?.textContent === 'Found 2 songs for "test"'
    })).toBeInTheDocument()
    
    // SongList component
    expect(screen.getByTestId('song-list')).toBeInTheDocument()
  })

  it('shows zero results correctly', () => {
    render(<SearchResults {...defaultProps} results={[]} query="nonexistent" />)
    
    expect(screen.getByText((content, node) => {
      return node?.textContent === 'Found 0 songs for "nonexistent"'
    })).toBeInTheDocument()
  })

  it('handles special characters in query', () => {
    const specialQuery = 'test & query "with" special chars'
    render(<SearchResults {...defaultProps} results={mockSongs} query={specialQuery} />)
    
    expect(screen.getByText((content, node) => {
      return node?.textContent?.includes('Found 2 songs for') ?? false
    })).toBeInTheDocument()
  })

  it('shows searching state overrides results count', () => {
    render(<SearchResults {...defaultProps} results={mockSongs} loading={true} query="test" />)
    
    expect(screen.getByText('Searching...')).toBeInTheDocument()
    expect(screen.queryByText(/Found \d+ songs/)).not.toBeInTheDocument()
  })

  it('applies correct styling to header section', () => {
    render(<SearchResults {...defaultProps} results={mockSongs} query="test" />)
    
    const headerElement = screen.getByText((content, node) => {
      return node?.textContent === 'Found 2 songs for "test"'
    }).parentElement
    expect(headerElement).toHaveStyle({
      padding: '1rem',
      borderBottom: '1px solid #e2e8f0'
    })
  })

  it('applies correct styling to empty state', () => {
    render(<SearchResults {...defaultProps} query="" />)
    
    const emptyStateElement = screen.getByText('Enter a search term to find songs')
    expect(emptyStateElement).toHaveStyle({
      padding: '2rem',
      textAlign: 'center',
      color: '#94a3b8'
    })
  })

  it('renders results when query changes from empty to non-empty', () => {
    const { rerender } = render(<SearchResults {...defaultProps} query="" />)
    
    expect(screen.getByText('Enter a search term to find songs')).toBeInTheDocument()
    
    rerender(<SearchResults {...defaultProps} results={mockSongs} query="amazing" />)
    
    expect(screen.getByText((content, node) => {
      return node?.textContent === 'Found 2 songs for "amazing"'
    })).toBeInTheDocument()
    expect(screen.getByTestId('song-list')).toBeInTheDocument()
  })
})