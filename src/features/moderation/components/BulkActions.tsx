import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useContentModeration } from '../hooks/useContentModeration'
import { bulkModerationActionSchema, type BulkModerationActionFormData } from '../validation/moderationSchemas'
import styles from './BulkActions.module.css'

interface BulkActionsProps {
  /** Number of selected items */
  selectedCount: number
  /** IDs of selected content items */
  selectedIds: string[]
  /** Callback when bulk action is completed */
  onAction: (action: string) => void
  /** Callback to clear selection */
  onClearSelection: () => void
}

/**
 * Component for performing bulk moderation actions on selected content
 */
export function BulkActions({ selectedCount, selectedIds, onAction, onClearSelection }: BulkActionsProps) {
  const [showForm, setShowForm] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'flag' | 'unflag' | null>(null)
  const { moderate, isProcessing } = useContentModeration()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<BulkModerationActionFormData>({
    resolver: zodResolver(bulkModerationActionSchema)
  })

  const handleActionClick = (action: 'approve' | 'reject' | 'flag' | 'unflag') => {
    setSelectedAction(action)
    
    // For approve, flag, unflag - execute immediately without form
    if (action !== 'reject') {
      handleBulkAction({ contentIds: selectedIds, action, note: '' })
    } else {
      // For reject - show form to require note
      setShowForm(true)
    }
  }

  const handleBulkAction = async (data: BulkModerationActionFormData) => {
    try {
      await moderate({
        contentIds: data.contentIds,
        action: data.action,
        note: data.note
      })
      
      setShowForm(false)
      setSelectedAction(null)
      reset()
      onAction(data.action)
      onClearSelection()
    } catch (error) {
      console.error('Failed to perform bulk action:', error)
    }
  }

  const onSubmit = (data: BulkModerationActionFormData) => {
    handleBulkAction({
      ...data,
      contentIds: selectedIds,
      action: selectedAction!
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setSelectedAction(null)
    reset()
  }

  if (selectedCount === 0) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.selectedCount}>
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <button
          onClick={onClearSelection}
          className={styles.clearBtn}
          disabled={isProcessing}
        >
          Clear Selection
        </button>
      </div>

      {!showForm ? (
        <div className={styles.actions}>
          <button
            onClick={() => handleActionClick('approve')}
            disabled={isProcessing}
            className={`${styles.actionBtn} ${styles.approveBtn}`}
          >
            Approve All
          </button>
          <button
            onClick={() => handleActionClick('reject')}
            disabled={isProcessing}
            className={`${styles.actionBtn} ${styles.rejectBtn}`}
          >
            Reject All
          </button>
          <button
            onClick={() => handleActionClick('flag')}
            disabled={isProcessing}
            className={`${styles.actionBtn} ${styles.flagBtn}`}
          >
            Flag All
          </button>
          <button
            onClick={() => handleActionClick('unflag')}
            disabled={isProcessing}
            className={`${styles.actionBtn} ${styles.unflagBtn}`}
          >
            Unflag All
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formHeader}>
            <h4>Reject {selectedCount} item{selectedCount !== 1 ? 's' : ''}</h4>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="bulk-note" className={styles.label}>
              Reason for rejection *
            </label>
            <textarea
              {...register('note')}
              id="bulk-note"
              placeholder="Please provide a reason for rejecting this content..."
              className={styles.textarea}
              rows={3}
            />
            {errors.note && (
              <span className={styles.error}>{errors.note.message}</span>
            )}
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isProcessing}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className={`${styles.actionBtn} ${styles.rejectBtn}`}
            >
              {isProcessing ? 'Rejecting...' : 'Reject All'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}