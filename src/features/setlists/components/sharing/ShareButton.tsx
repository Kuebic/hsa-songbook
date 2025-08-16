import { useState, useCallback } from 'react'
import { useNotification } from '@shared/components/notifications'
import { getShareableUrl } from '../../utils/shareIdGenerator'
import { ShareModal } from './ShareModal'
import type { Setlist } from '../../types/setlist.types'

interface ShareButtonProps {
  setlist: Setlist
  onGenerateShareId?: () => Promise<string>
}

export function ShareButton({ setlist, onGenerateShareId }: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { addNotification } = useNotification()
  
  const handleShare = useCallback(async () => {
    if (!setlist.shareId && onGenerateShareId) {
      setIsGenerating(true)
      try {
        await onGenerateShareId()
      } catch (error: unknown) {
        addNotification({
          type: 'error',
          title: 'Failed to generate share link',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        })
        return
      } finally {
        setIsGenerating(false)
      }
    }
    
    setIsModalOpen(true)
  }, [setlist.shareId, onGenerateShareId, addNotification])
  
  const handleCopyLink = useCallback(async () => {
    if (!setlist.shareId) return
    
    const url = getShareableUrl(setlist.shareId)
    
    try {
      await navigator.clipboard.writeText(url)
      addNotification({
        type: 'success',
        title: 'Link copied!',
        message: 'Share link has been copied to clipboard'
      })
    } catch (_error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      addNotification({
        type: 'success',
        title: 'Link copied!',
        message: 'Share link has been copied to clipboard'
      })
    }
  }, [setlist.shareId, addNotification])
  
  return (
    <>
      <button
        onClick={handleShare}
        disabled={isGenerating}
        className="share-button flex items-center gap-2"
        aria-label="Share setlist"
      >
        {isGenerating ? (
          <>
            <span className="spinner" />
            Generating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Share
          </>
        )}
      </button>
      
      {isModalOpen && (
        <ShareModal
          setlist={setlist}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCopyLink={handleCopyLink}
        />
      )}
    </>
  )
}