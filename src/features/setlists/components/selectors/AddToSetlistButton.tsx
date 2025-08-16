import { useState, useCallback } from 'react'
import { useAuth } from '@features/auth'
import { useSetlists } from '../../hooks/queries/useSetlistsQuery'
import { useAddToSetlist } from '../../hooks/mutations/useAddToSetlist'
import { SetlistSelectorModal } from './SetlistSelectorModal'
import type { Arrangement } from '@features/songs'
import type { SetlistArrangement } from '../../types/setlist.types'

interface AddToSetlistButtonProps {
  arrangement: Arrangement
  variant?: 'icon' | 'button' | 'menu-item'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AddToSetlistButton({ 
  arrangement, 
  variant = 'button',
  size = 'md',
  className 
}: AddToSetlistButtonProps) {
  const { isSignedIn } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: setlists } = useSetlists({ userId: 'me' })
  const addToSetlist = useAddToSetlist()
  
  // Check if arrangement is already in setlists
  const setlistCount = setlists?.content?.filter(s => 
    s.arrangements.some(a => a.arrangementId === arrangement.id)
  ).length || 0
  
  const handleClick = useCallback(() => {
    if (!isSignedIn) {
      // Trigger sign-in flow
      window.location.href = '/sign-in?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }
    
    setIsModalOpen(true)
  }, [isSignedIn])
  
  const handleAddToSetlist = useCallback(async (setlistId: string, options?: Partial<SetlistArrangement>) => {
    await addToSetlist.mutateAsync({
      setlistId,
      arrangementId: arrangement.id,
      ...options
    })
    setIsModalOpen(false)
  }, [arrangement.id, addToSetlist])
  
  // Render based on variant
  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`add-to-setlist-icon ${className}`}
          aria-label="Add to setlist"
          title={setlistCount > 0 ? `In ${setlistCount} setlists` : 'Add to setlist'}
        >
          {setlistCount > 0 ? (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
        
        {isModalOpen && (
          <SetlistSelectorModal
            arrangement={arrangement}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSelect={handleAddToSetlist}
          />
        )}
      </>
    )
  }
  
  if (variant === 'menu-item') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`menu-item ${className}`}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
          </svg>
          Add to Setlist
          {setlistCount > 0 && (
            <span className="ml-auto text-xs text-gray-500">({setlistCount})</span>
          )}
        </button>
        
        {isModalOpen && (
          <SetlistSelectorModal
            arrangement={arrangement}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSelect={handleAddToSetlist}
          />
        )}
      </>
    )
  }
  
  // Default button variant
  return (
    <>
      <button
        onClick={handleClick}
        className={`add-to-setlist-button ${size} ${className}`}
        disabled={addToSetlist.isPending}
      >
        {addToSetlist.isPending ? (
          <span className="spinner" />
        ) : setlistCount > 0 ? (
          <>
            <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            In {setlistCount} Setlist{setlistCount !== 1 ? 's' : ''}
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
            </svg>
            Add to Setlist
          </>
        )}
      </button>
      
      {isModalOpen && (
        <SetlistSelectorModal
          arrangement={arrangement}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleAddToSetlist}
        />
      )}
    </>
  )
}