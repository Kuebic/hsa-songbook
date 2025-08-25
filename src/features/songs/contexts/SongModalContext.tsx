import { useState, useCallback, type ReactNode } from 'react'
import type { Song } from '../types/song.types'
import { SongModalContext, type SongModalContextType } from './SongModalContext'

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

// Hook moved to ../hooks/useSongModal.ts