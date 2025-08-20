import { useState, useEffect } from 'react'
import { arrangementService } from '@features/songs/services/arrangementService'
import { songService } from '@features/songs/services/songService'
import type { ArrangementViewerData, ArrangementDTO } from '../types/viewer.types'
import { mapDTOToViewModel } from '../types/viewer.types'

export function useArrangementViewer(slug: string) {
  const [arrangement, setArrangement] = useState<ArrangementViewerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArrangement = async () => {
      if (!slug) {
        setError('No arrangement slug provided')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Try to get with chord data first
        let data
        try {
          data = await arrangementService.getArrangementBySlug(slug)
        } catch (err) {
          // If decompression fails, try without chord data
          console.warn('Failed to get chord data, retrying without:', err)
          data = await arrangementService.getArrangementBySlug(slug)
        }

        if (data) {
          // Cast to DTO type for type safety
          const dto = data as ArrangementDTO
          
          // Use the type-safe mapper function
          const viewModel = mapDTOToViewModel(dto)
          
          // Fetch the associated song to get its slug and title
          let songSlug = ''
          let songTitle = viewModel.name || 'Unknown Song'
          let artist = ''
          
          // If we have a songId, fetch the song details
          if (viewModel.songIds && viewModel.songIds.length > 0) {
            try {
              const song = await songService.getSongById(viewModel.songIds[0])
              if (song) {
                songSlug = song.slug
                songTitle = song.title
                artist = song.artist || ''
              }
            } catch (err) {
              console.warn('Failed to fetch song details for arrangement:', err)
              // Continue without song details - fallback to songs list
            }
          }
          
          // Log if no chord data found (but don't assign fake data)
          if (!viewModel.chordProText) {
            console.info('No chord data found in arrangement:', dto.slug)
            // Keep chordProText empty - ChordSheetViewer will show proper empty state
          }

          // Set the properly typed arrangement data
          const arrangementData: ArrangementViewerData = {
            ...viewModel,
            songTitle,
            songSlug,
            artist
          }
          
          setArrangement(arrangementData)
        } else {
          setError('Arrangement not found')
        }
      } catch (err) {
        console.error('Failed to fetch arrangement:', err)
        setError(err instanceof Error ? err.message : 'Failed to load arrangement')
      } finally {
        setLoading(false)
      }
    }

    fetchArrangement()
  }, [slug]) // Remove getToken and userId to prevent re-fetching

  return { arrangement, loading, error }
}