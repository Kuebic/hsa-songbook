import { useState, useEffect } from 'react'
import { arrangementService } from '@features/songs/services/arrangementService'
import type { ArrangementViewerData } from '../types/viewer.types'

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
          data = await arrangementService.getArrangementBySlug(slug, true)
        } catch (err) {
          // If decompression fails, try without chord data
          console.warn('Failed to get chord data, retrying without:', err)
          data = await arrangementService.getArrangementBySlug(slug, false)
        }

        if (data) {
          // Server now provides decompressed chordProText
          // Use sample chord data if none exists (for demo purposes)
          const sampleChordPro = `{title: ${data.name}}
{key: ${data.key || 'C'}}
{tempo: ${data.tempo || 120}}

[Verse 1]
[C]Amazing grace, how [F]sweet the [C]sound
That [C]saved a wretch like [G]me
I [C]once was lost, but [F]now am [C]found
Was [C]blind but [G]now I [C]see

[Chorus]
My [F]chains are gone, I've been set [C]free
My God, my [F]Savior has ransomed [C]me
And like a [F]flood His mercy [C]reigns
Unending [Am]love, [G]amazing [C]grace`

          setArrangement({
            id: data.id,
            name: data.name,
            slug: data.slug,
            songTitle: '', // TODO: Will need song data lookup from songIds
            artist: '',    // TODO: Will need song data lookup from songIds
            key: data.key,
            tempo: data.tempo,
            timeSignature: data.timeSignature,
            difficulty: data.difficulty,
            chordProText: (data as unknown as Record<string, unknown>).chordProText as string || sampleChordPro, // Use sample if no data
            tags: data.tags,
            createdBy: data.createdBy || ''
          })
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