import type { Song } from '@features/songs'

export interface Setlist {
  id: string
  name: string
  description?: string
  songs: SetlistSong[]
  createdAt: Date
  updatedAt: Date
  isPublic: boolean
  createdBy?: string
}

export interface SetlistSong {
  song: Song
  notes?: string
  keyOverride?: string
  order: number
}