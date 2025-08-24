import { useState } from 'react'
import { useContentModeration } from '../hooks/useContentModeration'
import type { ModerationItem } from '../types/moderation.types'
import styles from './ContentReviewCard.module.css'

interface ContentReviewCardProps {
  /** The moderation item to display */
  item: ModerationItem
  /** Whether this card is selected for bulk operations */
  selected: boolean
  /** Callback when card selection changes */
  onSelect: (id: string) => void
  /** Callback when moderation action is completed */
  onModerate: () => void
}

/**
 * Card component for reviewing individual content items in moderation queue
 */
export function ContentReviewCard({ item, selected, onSelect, onModerate }: ContentReviewCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { approve, reject, flag, isProcessing } = useContentModeration()

  const handleApprove = async () => {
    try {
      await approve({ contentIds: [item.contentId] })
      onModerate()
    } catch (error) {
      console.error('Failed to approve content:', error)
    }
  }

  const handleReject = async () => {
    const note = prompt('Reason for rejection:')
    if (note) {
      try {
        await reject({ contentIds: [item.contentId], note })
        onModerate()
      } catch (error) {
        console.error('Failed to reject content:', error)
      }
    }
  }

  const handleFlag = async () => {
    try {
      await flag({ contentIds: [item.contentId] })
      onModerate()
    } catch (error) {
      console.error('Failed to flag content:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className={`${styles.card} ${selected ? styles.selected : ''}`}>
      <div className={styles.header}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(item.contentId)}
          className={styles.checkbox}
          disabled={isProcessing}
        />
        
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{item.title}</h3>
          <span className={styles.type}>{item.contentType}</span>
          <span className={`${styles.status} ${styles[`status-${item.status}`]}`}>
            {item.status}
          </span>
          {item.reportCount > 0 && (
            <span className={styles.reportCount}>
              {item.reportCount} report{item.reportCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className={styles.metadata}>
          <span>By: {item.creator.email}</span>
          <span>Created: {formatDate(item.createdAt)}</span>
          {item.moderatedAt && (
            <span>Moderated: {formatDate(item.moderatedAt)}</span>
          )}
        </div>
      </div>

      <div className={styles.preview} onClick={() => setExpanded(!expanded)}>
        <div className={styles.previewHeader}>
          <span>Content Preview</span>
          <button className={styles.expandBtn}>
            {expanded ? '▼' : '▶'}
          </button>
        </div>
        
        {expanded && (
          <div className={styles.previewContent}>
            {item.contentType === 'song' ? (
              <div>
                <p><strong>Artist:</strong> {(item.content.artist as string) || 'Unknown'}</p>
                <p><strong>Themes:</strong> {
                  Array.isArray(item.content.themes) 
                    ? (item.content.themes as string[]).join(', ') 
                    : 'None'
                }</p>
                {item.content.lyrics && typeof item.content.lyrics === 'object' && 
                  item.content.lyrics && 'en' in item.content.lyrics && 
                  typeof (item.content.lyrics as Record<string, unknown>).en === 'string' && (
                  <div>
                    <strong>Lyrics:</strong>
                    <pre className={styles.lyricsPreview}>
                      {((item.content.lyrics as Record<string, unknown>).en as string).substring(0, 500)}
                      {((item.content.lyrics as Record<string, unknown>).en as string).length > 500 && '...'}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p><strong>Key:</strong> {(item.content.key as string) || 'Unknown'}</p>
                <p><strong>Tempo:</strong> {(item.content.tempo as string) || 'Unknown'}</p>
                <p><strong>Difficulty:</strong> {(item.content.difficulty as string) || 'Unknown'}</p>
                {item.content.chord_data && typeof item.content.chord_data === 'string' && (
                  <div>
                    <strong>Chord Data:</strong>
                    <pre className={styles.chordPreview}>
                      {String(item.content.chord_data).substring(0, 300)}
                      {String(item.content.chord_data).length > 300 && '...'}
                    </pre>
                  </div>
                )}
              </div>
            )}
            
            {item.moderationNote && (
              <div className={styles.moderationNote}>
                <strong>Moderation Note:</strong>
                <p>{item.moderationNote}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          onClick={handleApprove}
          disabled={isProcessing || item.status === 'approved'}
          className={`${styles.actionBtn} ${styles.approveBtn}`}
        >
          Approve
        </button>
        <button
          onClick={handleReject}
          disabled={isProcessing || item.status === 'rejected'}
          className={`${styles.actionBtn} ${styles.rejectBtn}`}
        >
          Reject
        </button>
        <button
          onClick={handleFlag}
          disabled={isProcessing || item.status === 'flagged'}
          className={`${styles.actionBtn} ${styles.flagBtn}`}
        >
          Flag
        </button>
        <a
          href={`/${item.contentType}s/${item.content.slug || item.contentId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.actionBtn} ${styles.viewBtn}`}
        >
          View Full
        </a>
      </div>
    </div>
  )
}