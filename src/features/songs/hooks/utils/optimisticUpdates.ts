import type { Song } from '@features/songs/types/song.types'
import type { SongFormData } from '@features/songs/validation/schemas/songFormSchema'

export function createOptimisticSong(
  formData: SongFormData,
  userId: string
): Song {
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const slug = `temp-${formData.title.toLowerCase().replace(/\s+/g, '-')}`
  
  return {
    id: tempId,
    title: formData.title,
    artist: formData.artist || '',
    slug,
    compositionYear: formData.compositionYear,
    ccli: formData.ccli,
    themes: formData.themes,
    source: formData.source,
    notes: formData.notes,
    metadata: {
      createdBy: userId,
      lastModifiedBy: userId,
      isPublic: formData.isPublic || false,
      ratings: { average: 0, count: 0 },
      views: 0
    }
  }
}

export function updateOptimisticSong(
  existing: Song,
  updates: Partial<SongFormData>
): Song {
  return {
    ...existing,
    ...updates,
    metadata: {
      ...existing.metadata,
      lastModifiedBy: 'current-user'
    }
  }
}

export function isOptimisticSong(song: Song): boolean {
  return song.id.startsWith('temp-')
}

export function replaceOptimisticSong(
  songs: Song[],
  tempId: string,
  realSong: Song
): Song[] {
  return songs.map(song => 
    song.id === tempId ? realSong : song
  )
}

export function removeOptimisticSong(
  songs: Song[],
  tempId: string
): Song[] {
  return songs.filter(song => song.id !== tempId)
}