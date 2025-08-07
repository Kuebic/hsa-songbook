import { useCallback } from 'react'
import { z } from 'zod'
import { InlineEditField } from './InlineEditField'
import { useSongMutations } from '../hooks/useSongMutations'
import { useAuth } from '@features/auth'
import type { Song } from '../types/song.types'

interface SongTitleEditProps {
  song: Song
  onUpdate?: (updatedSong: Song) => void
}

const titleValidator = z.string()
  .min(1, 'Title is required')
  .max(200, 'Title must be less than 200 characters')
  .refine(val => val.trim().length > 0, 'Title cannot be empty')

export function SongTitleEdit({ song, onUpdate }: SongTitleEditProps) {
  const { updateSongTitle } = useSongMutations()
  const { isSignedIn, isAdmin, userId } = useAuth()
  
  // Check edit permissions
  const canEdit = isSignedIn && (
    isAdmin || 
    (song.metadata?.createdBy === userId)
  )
  
  
  const handleSave = useCallback(async (newTitle: string) => {
    if (newTitle === song.title) return // No change
    
    const updatedSong = await updateSongTitle(song.id, newTitle)
    onUpdate?.(updatedSong)
  }, [song.id, song.title, updateSongTitle, onUpdate])
  
  return (
    <InlineEditField
      value={song.title}
      onSave={handleSave}
      validator={titleValidator}
      placeholder="Enter song title..."
      ariaLabel={`Song title: ${song.title}`}
      canEdit={canEdit ?? false}
    />
  )
}