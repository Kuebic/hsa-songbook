import { createContext } from 'react'
import type { Song } from '../types/song.types'

export interface SongModalContextType {
  isOpen: boolean
  selectedSong: Song | undefined
  openCreateModal: () => void
  openEditModal: (song: Song) => void
  closeModal: () => void
}

export const SongModalContext = createContext<SongModalContextType | null>(null)