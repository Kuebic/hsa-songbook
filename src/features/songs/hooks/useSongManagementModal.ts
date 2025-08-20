import { useState, useCallback } from 'react'
import type { Song } from '../types/song.types'

interface UseSongManagementModalReturn {
  isOpen: boolean
  selectedSong: Song | undefined
  openModal: (song?: Song) => void
  closeModal: () => void
  openCreateModal: () => void
  openEditModal: (song: Song) => void
}

/**
 * Hook to manage the song management modal state
 * 
 * @example
 * ```tsx
 * const { isOpen, selectedSong, openModal, closeModal } = useSongManagementModal()
 * 
 * // Open for creating new song
 * openModal()
 * 
 * // Open for editing existing song
 * openModal(existingSong)
 * ```
 */
export function useSongManagementModal(): UseSongManagementModalReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSong, setSelectedSong] = useState<Song | undefined>(undefined)
  
  const openModal = useCallback((song?: Song) => {
    setSelectedSong(song)
    setIsOpen(true)
  }, [])
  
  const closeModal = useCallback(() => {
    setIsOpen(false)
    // Clear selected song after animation
    setTimeout(() => setSelectedSong(undefined), 200)
  }, [])
  
  const openCreateModal = useCallback(() => {
    openModal(undefined)
  }, [openModal])
  
  const openEditModal = useCallback((song: Song) => {
    openModal(song)
  }, [openModal])
  
  return {
    isOpen,
    selectedSong,
    openModal,
    closeModal,
    openCreateModal,
    openEditModal
  }
}