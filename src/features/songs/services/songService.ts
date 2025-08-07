import type { Song, Arrangement, SongFilter } from '../types/song.types'

// Mock data for now - will be replaced with API calls
const mockSongs: Song[] = [
  {
    id: '1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    slug: 'amazing-grace',
    compositionYear: 1772,
    ccli: '22025',
    themes: ['grace', 'salvation', 'traditional'],
    source: 'Holy Songbook Vol. 1',
    notes: 'Traditional hymn, widely known',
    metadata: {
      isPublic: true,
      views: 1500,
      ratings: { average: 4.8, count: 250 }
    }
  },
  {
    id: '2',
    title: 'How Great Thou Art',
    artist: 'Carl Boberg',
    slug: 'how-great-thou-art',
    compositionYear: 1885,
    themes: ['worship', 'creation', 'majesty'],
    source: 'Holy Songbook Vol. 1',
    metadata: {
      isPublic: true,
      views: 1200,
      ratings: { average: 4.9, count: 180 }
    }
  },
  {
    id: '3',
    title: 'Blessed Be',
    artist: 'Matt Redman',
    slug: 'blessed-be',
    compositionYear: 2002,
    themes: ['praise', 'contemporary', 'worship'],
    metadata: {
      isPublic: true,
      views: 800,
      ratings: { average: 4.5, count: 120 }
    }
  }
]

export const songService = {
  async getAllSongs(): Promise<Song[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockSongs
  },

  async getSongById(id: string): Promise<Song | null> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return mockSongs.find(song => song.id === id) || null
  },

  async getSongBySlug(slug: string): Promise<Song | null> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return mockSongs.find(song => song.slug === slug) || null
  },

  async searchSongs(filter: SongFilter): Promise<Song[]> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    let filtered = [...mockSongs]
    
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      filtered = filtered.filter(song => 
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.themes.some(theme => theme.toLowerCase().includes(query))
      )
    }
    
    if (filter.themes && filter.themes.length > 0) {
      filtered = filtered.filter(song =>
        filter.themes!.some(theme => song.themes.includes(theme))
      )
    }
    
    return filtered
  },

  async getArrangementsBySongId(songId: string): Promise<Arrangement[]> {
    // Mock arrangement data
    await new Promise(resolve => setTimeout(resolve, 100))
    return [
      {
        id: 'arr1',
        name: 'Key of G',
        songIds: [songId],
        key: 'G',
        tempo: 120,
        timeSignature: '4/4',
        difficulty: 'beginner',
        tags: ['acoustic', 'simple'],
        chordData: '[G]Amazing [C]grace, how [G]sweet the [D]sound'
      }
    ]
  }
}