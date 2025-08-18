import type { Setlist, SetlistArrangement } from '../types/setlist.types'
import type { PopulatedArrangement } from '../types/playback.types'

// Use localStorage for fetching setlists (same as useSetlists hook)
const STORAGE_KEY = 'hsa-songbook-setlists'

class PlaybackService {
  /**
   * Fetch setlist with fully populated arrangements for playback
   */
  async getPlayableSetlist(
    setlistId: string, 
    _token?: string
  ): Promise<Setlist & { arrangements: PopulatedArrangement[] }> {
    // Fetch the setlist from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const allSetlists = stored ? JSON.parse(stored) : []
      const setlist = allSetlists.find((sl: Setlist) => sl.id === setlistId)
      
      if (!setlist) {
        throw new Error(`Setlist ${setlistId} not found`)
      }
      
      // Ensure all arrangements are populated with their full data
      const populated = setlist.arrangements.map((item: SetlistArrangement) => {
        // The arrangement data should already be included from when it was added
        // If not, we ensure it has at least the required fields
        if (!item.arrangement) {
          console.error('Missing arrangement data for:', item.arrangementId)
          return {
            ...item,
            arrangement: {
              id: item.arrangementId,
              name: 'Unknown Arrangement',
              key: 'C',
              chordProText: '',
              chordData: '',
              difficulty: 'medium'
            }
          }
        }
        return item as PopulatedArrangement
      })
      
      return { 
        ...setlist, 
        arrangements: populated,
        // Ensure dates are strings
        createdAt: setlist.createdAt instanceof Date ? setlist.createdAt.toISOString() : setlist.createdAt,
        updatedAt: setlist.updatedAt instanceof Date ? setlist.updatedAt.toISOString() : setlist.updatedAt
      }
    } catch (error) {
      console.error('Error loading setlist:', error)
      throw error
    }
  }
  
  /**
   * Save key override preference
   */
  async updateArrangementKey(
    setlistId: string,
    arrangementId: string,
    key: string,
    _token?: string
  ): Promise<void> {
    // Mock implementation - will be replaced with actual API call
    console.log('Updating key:', { setlistId, arrangementId, key })
  }
  
  /**
   * Preload next arrangement for smooth transitions
   */
  preloadArrangement(arrangementId: string): void {
    // Mock implementation - will be replaced with actual preloading
    console.log('Preloading arrangement:', arrangementId)
  }
}

export const playbackService = new PlaybackService()