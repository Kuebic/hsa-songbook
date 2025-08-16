// Public exports for the setlists feature
export { SetlistPage } from './pages/SetlistPage'
export { PublicSetlistPage } from './pages/PublicSetlistPage'
export { SetlistPlaybackPage } from './pages/SetlistPlaybackPage'
export { SetlistBuilder } from './components/SetlistBuilder'
export { SetlistCard } from './components/SetlistCard'
export { ShareButton, ShareModal } from './components/sharing'

// Add to setlist functionality
export { AddToSetlistButton, SetlistSelectorModal } from './components/selectors'

// Playback mode components and context
export { PlaybackProvider, usePlayback } from './contexts/PlaybackContext'
export { SetlistPlayer, PlayerControls, ProgressIndicator } from './components/player'

// Legacy hooks (keep for backward compatibility)
export { useSetlists, useSetlist } from './hooks/useSetlists'

// New React Query hooks
export { 
  useSetlists as useSetlistsQuery, 
  useSetlist as useSetlistQuery, 
  usePublicSetlist, 
  useInfiniteSetlists,
  setlistKeys 
} from './hooks/queries'

export { 
  useCreateSetlist, 
  useUpdateSetlist, 
  useReorderArrangements,
  useAddToSetlist 
} from './hooks/mutations'

export type { 
  Setlist, 
  SetlistArrangement, 
  PlayableSetlist,
  PopulatedSetlistArrangement,
  SetlistFilters, 
  CreateSetlistRequest, 
  Page 
} from './types/setlist.types'
export { setlistService } from './services/setlistService'

// Sharing utilities
export { 
  createShareableId, 
  isValidShareId, 
  getShareableUrl, 
  getQRCodeUrl 
} from './utils/shareIdGenerator'