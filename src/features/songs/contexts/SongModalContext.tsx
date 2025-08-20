import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Song } from '../types/song.types'

interface SongModalContextType {
  isOpen: boolean
  selectedSong: Song | undefined
  openCreateModal: () => void
  openEditModal: (song: Song) => void
  closeModal: () => void
}

export const SongModalContext = createContext<SongModalContextType | null>(null)

interface SongModalProviderProps {
  children: ReactNode
}

export function SongModalProvider({ children }: SongModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSong, setSelectedSong] = useState<Song | undefined>(undefined)
  
  const openCreateModal = useCallback(() => {
    setSelectedSong(undefined)
    setIsOpen(true)
  }, [])
  
  const openEditModal = useCallback((song: Song) => {
    setSelectedSong(song)
    setIsOpen(true)
  }, [])
  
  const closeModal = useCallback(() => {
    setIsOpen(false)
    // Clear selected song after animation
    setTimeout(() => setSelectedSong(undefined), 200)
  }, [])
  
  const value: SongModalContextType = {
    isOpen,
    selectedSong,
    openCreateModal,
    openEditModal,
    closeModal
  }
  
  return (
    <SongModalContext.Provider value={value}>
      {children}
    </SongModalContext.Provider>
  )
}

export function useSongModal(): SongModalContextType {
  const context = useContext(SongModalContext)
  if (!context) {
    throw new Error('useSongModal must be used within a SongModalProvider')
  }
  return context
}