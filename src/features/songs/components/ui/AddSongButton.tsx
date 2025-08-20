import { Button } from '@shared/components/ui/Button'
import { useAuth } from '@features/auth/hooks/useAuth'
import { useSongModal } from '../../contexts/SongModalContext'

export function AddSongButton() {
  const { isSignedIn, isLoaded } = useAuth()
  const { openCreateModal } = useSongModal()
  
  const handleButtonClick = () => {
    openCreateModal()
  }
  
  // Don't render until auth state is loaded
  if (!isLoaded) return null
  
  // Only show for authenticated users (including anonymous)
  if (!isSignedIn) return null
  
  return (
    <Button 
      onClick={handleButtonClick}
      variant="default"
      size="sm"
      aria-label="Add new song"
      title="Add a new song to the library"
    >
      <span style={{ marginRight: '4px' }}>+</span>
      Add Song
    </Button>
  )
}