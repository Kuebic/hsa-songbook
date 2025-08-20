import { useAuth } from '@features/auth/hooks/useAuth'

export function AddSongButton() {
  const { isSignedIn } = useAuth()
  
  if (!isSignedIn) return null
  
  // Simplified - just a placeholder for now
  // Full song creation would require a form implementation
  return null
}