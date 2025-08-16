import type { Setlist } from '../types/setlist.types'
import type { PopulatedArrangement } from '../types/playback.types'

class PlaybackService {
  /**
   * Fetch setlist with fully populated arrangements for playback
   */
  async getPlayableSetlist(
    setlistId: string, 
    _token?: string
  ): Promise<Setlist & { arrangements: PopulatedArrangement[] }> {
    // For now, return mock data - will be replaced with actual API calls
    const setlist: Setlist & { arrangements: PopulatedArrangement[] } = {
      id: setlistId,
      name: 'Mock Setlist',
      arrangements: [],
      description: '',
      userId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Ensure all arrangements are populated
    const populated = await Promise.all(
      setlist.arrangements.map(async (item) => {
        if (!item.arrangement) {
          // Mock arrangement fetch
          const arr = {
            id: item.arrangementId,
            name: 'Mock Arrangement',
            key: 'C',
            content: ''
          }
          return { ...item, arrangement: arr }
        }
        return item as PopulatedArrangement
      })
    )
    
    return { ...setlist, arrangements: populated }
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