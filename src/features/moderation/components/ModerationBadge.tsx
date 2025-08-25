import { Shield, Lock, AlertCircle, XCircle } from 'lucide-react'
import styles from './ModerationBadge.module.css'

// Type-safe moderation status values
const MODERATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FLAGGED: 'flagged'
} as const

type ModerationStatus = typeof MODERATION_STATUS[keyof typeof MODERATION_STATUS]

interface ModerationBadgeProps {
  moderationStatus?: ModerationStatus | null
  isPrivate?: boolean
  className?: string
}

export function ModerationBadge({ moderationStatus, isPrivate, className }: ModerationBadgeProps) {
  // Don't show badge for approved public content
  if (!isPrivate && (moderationStatus === MODERATION_STATUS.APPROVED || moderationStatus === null)) {
    return null
  }

  const badges = []

  // Private badge
  if (isPrivate) {
    badges.push(
      <span key="private" className={`${styles.badge} ${styles.private}`} title="Private - Only visible to creator and moderators">
        <Lock className={styles.icon} />
        <span>Private</span>
      </span>
    )
  }

  // Moderation status badges
  if (moderationStatus === MODERATION_STATUS.PENDING) {
    badges.push(
      <span key="pending" className={`${styles.badge} ${styles.pending}`} title="Pending moderation review">
        <Shield className={styles.icon} />
        <span>Pending Review</span>
      </span>
    )
  } else if (moderationStatus === MODERATION_STATUS.REJECTED) {
    badges.push(
      <span key="rejected" className={`${styles.badge} ${styles.rejected}`} title="Rejected by moderators">
        <XCircle className={styles.icon} />
        <span>Rejected</span>
      </span>
    )
  } else if (moderationStatus === MODERATION_STATUS.FLAGGED) {
    badges.push(
      <span key="flagged" className={`${styles.badge} ${styles.flagged}`} title="Flagged for review">
        <AlertCircle className={styles.icon} />
        <span>Flagged</span>
      </span>
    )
  }

  if (badges.length === 0) return null

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {badges}
    </div>
  )
}