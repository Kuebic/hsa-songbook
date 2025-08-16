import { useState, useCallback } from 'react'
import { Modal } from '@shared/components/modal'
import { useNotification } from '@shared/components/notifications'
import { getShareableUrl, getQRCodeUrl } from '../../utils/shareIdGenerator'
import type { Setlist } from '../../types/setlist.types'

interface ShareModalProps {
  setlist: Setlist
  isOpen: boolean
  onClose: () => void
  onCopyLink: () => void
}

export function ShareModal({ setlist, isOpen, onClose, onCopyLink }: ShareModalProps) {
  const [showQR, setShowQR] = useState(false)
  const { addNotification } = useNotification()
  
  const handleCopyUrl = useCallback(async () => {
    onCopyLink()
    onClose()
  }, [onCopyLink, onClose])
  
  const handleShareNative = useCallback(async () => {
    if (!setlist.shareId || !navigator.share) return
    
    const shareUrl = getShareableUrl(setlist.shareId)
    
    try {
      await navigator.share({
        title: `${setlist.name} - HSA Songbook`,
        text: `Check out this setlist: ${setlist.name}`,
        url: shareUrl
      })
      addNotification({
        type: 'success',
        title: 'Shared successfully',
        message: 'Setlist has been shared'
      })
      onClose()
    } catch (error: unknown) {
      const errorName = error instanceof Error ? error.name : 'Unknown'
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      if (errorName !== 'AbortError') {
        addNotification({
          type: 'error',
          title: 'Share failed',
          message: errorMessage
        })
      }
    }
  }, [setlist.name, setlist.shareId, addNotification, onClose])
  
  if (!setlist.shareId) {
    return null
  }
  
  const shareUrl = getShareableUrl(setlist.shareId)
  const qrCodeUrl = getQRCodeUrl(setlist.shareId)
  const canShare = navigator.share !== undefined
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Setlist"
      size="medium"
      testId="share-modal"
    >
      <div className="p-6 space-y-6">
        {/* Setlist Info */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {setlist.name}
          </h3>
          {setlist.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {setlist.description}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {setlist.arrangements.length} {setlist.arrangements.length === 1 ? 'song' : 'songs'}
          </p>
        </div>
        
        {/* Share URL */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Share Link
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopyUrl}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Anyone with this link can view the setlist without signing in
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {canShare && (
            <button
              onClick={handleShareNative}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              Share with Apps
            </button>
          )}
          
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            {showQR ? 'Hide QR Code' : 'Show QR Code'}
          </button>
        </div>
        
        {/* QR Code */}
        {showQR && (
          <div className="text-center space-y-3">
            <img
              src={qrCodeUrl}
              alt="QR Code for setlist share URL"
              className="mx-auto rounded-lg shadow-md"
              width={256}
              height={256}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Scan with camera app to open setlist
            </p>
          </div>
        )}
        
        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}