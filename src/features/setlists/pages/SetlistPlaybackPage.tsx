import { useParams } from 'react-router-dom'
import { PlaybackMode } from '../components/playback/PlaybackMode'

export function SetlistPlaybackPage() {
  const { id, index } = useParams<{ id: string; index?: string }>()
  
  if (!id) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'var(--text-primary)'
      }}>
        Invalid setlist ID
      </div>
    )
  }
  
  return (
    <PlaybackMode 
      setlistId={id} 
      initialIndex={index ? parseInt(index, 10) : 0}
    />
  )
}