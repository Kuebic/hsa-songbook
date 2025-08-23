import { useState, useMemo } from 'react'
import { useModerationQueue } from '../hooks/useModerationQueue'
import { ContentReviewCard } from './ContentReviewCard'
import { BulkActions } from './BulkActions'
import type { ModerationFilter } from '../types/moderation.types'
import styles from './ModerationQueue.module.css'

interface ModerationQueueProps {
  /** Filter settings for the queue */
  filter: ModerationFilter
  /** Currently selected item IDs for bulk operations */
  selectedItems: string[]
  /** Callback when selection changes */
  onSelectionChange: (selectedIds: string[]) => void
}

/**
 * Main moderation queue interface showing content awaiting review
 */
export function ModerationQueue({ filter, selectedItems, onSelectionChange }: ModerationQueueProps) {
  const { items, isLoading, isFetching, error, refetch } = useModerationQueue(filter)
  const [selectAllChecked, setSelectAllChecked] = useState(false)

  // Handle individual item selection
  const handleItemSelect = (contentId: string) => {
    if (selectedItems.includes(contentId)) {
      onSelectionChange(selectedItems.filter(id => id !== contentId))
    } else {
      onSelectionChange([...selectedItems, contentId])
    }
  }

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectAllChecked) {
      onSelectionChange([])
      setSelectAllChecked(false)
    } else {
      const allIds = items.map(item => item.contentId)
      onSelectionChange(allIds)
      setSelectAllChecked(true)
    }
  }

  // Update select all checkbox when selection changes
  useMemo(() => {
    if (items.length === 0) {
      setSelectAllChecked(false)
    } else {
      setSelectAllChecked(selectedItems.length === items.length && items.length > 0)
    }
  }, [selectedItems.length, items.length])

  // Handle moderation action completion
  const handleModerationComplete = () => {
    refetch()
    onSelectionChange([])
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h3>Error loading moderation queue</h3>
        <p>{error.message}</p>
        <button onClick={() => refetch()} className={styles.retryBtn}>
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Queue Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Moderation Queue</h2>
          <span className={styles.itemCount}>
            {items.length} item{items.length !== 1 ? 's' : ''}
            {isLoading && ' (loading...)'}
            {isFetching && !isLoading && ' (updating...)'}
          </span>
        </div>
        
        {items.length > 0 && (
          <div className={styles.headerRight}>
            <label className={styles.selectAllLabel}>
              <input
                type="checkbox"
                checked={selectAllChecked}
                onChange={handleSelectAll}
                disabled={isLoading}
              />
              Select All
            </label>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className={styles.refreshBtn}
              title="Refresh queue"
            >
              ↻ Refresh
            </button>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <BulkActions
          selectedCount={selectedItems.length}
          selectedIds={selectedItems}
          onAction={handleModerationComplete}
          onClearSelection={() => onSelectionChange([])}
        />
      )}

      {/* Queue Items */}
      <div className={styles.queue}>
        {isLoading && items.length === 0 ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading moderation queue...</p>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No items in queue</h3>
            <p>All content has been reviewed or there's nothing matching your current filters.</p>
          </div>
        ) : (
          items.map((item) => (
            <ContentReviewCard
              key={item.contentId}
              item={item}
              selected={selectedItems.includes(item.contentId)}
              onSelect={handleItemSelect}
              onModerate={handleModerationComplete}
            />
          ))
        )}
      </div>
    </div>
  )
}