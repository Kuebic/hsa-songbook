import { useState, useCallback } from 'react'
import type { Arrangement } from '../types/song.types'

interface UseArrangementManagementModalReturn {
  isOpen: boolean
  selectedArrangement: Arrangement | undefined
  selectedSongId: string | undefined
  openModal: (arrangement?: Arrangement, songId?: string) => void
  closeModal: () => void
  openCreateModal: (songId?: string) => void
  openEditModal: (arrangement: Arrangement) => void
}

/**
 * Hook to manage the arrangement management modal state
 * 
 * @example
 * ```tsx
 * const { isOpen, selectedArrangement, openModal, closeModal } = useArrangementManagementModal()
 * 
 * // Open for creating new arrangement
 * openModal(undefined, songId)
 * 
 * // Open for editing existing arrangement
 * openModal(existingArrangement)
 * ```
 */
export function useArrangementManagementModal(): UseArrangementManagementModalReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedArrangement, setSelectedArrangement] = useState<Arrangement | undefined>(undefined)
  const [selectedSongId, setSelectedSongId] = useState<string | undefined>(undefined)
  
  const openModal = useCallback((arrangement?: Arrangement, songId?: string) => {
    setSelectedArrangement(arrangement)
    setSelectedSongId(songId)
    setIsOpen(true)
  }, [])
  
  const closeModal = useCallback(() => {
    setIsOpen(false)
    // Clear selected arrangement and songId after animation
    setTimeout(() => {
      setSelectedArrangement(undefined)
      setSelectedSongId(undefined)
    }, 200)
  }, [])
  
  const openCreateModal = useCallback((songId?: string) => {
    openModal(undefined, songId)
  }, [openModal])
  
  const openEditModal = useCallback((arrangement: Arrangement) => {
    openModal(arrangement)
  }, [openModal])
  
  return {
    isOpen,
    selectedArrangement,
    selectedSongId,
    openModal,
    closeModal,
    openCreateModal,
    openEditModal
  }
}