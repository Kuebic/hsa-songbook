import { useQuery } from '@tanstack/react-query'
import { moderationService } from '../services/moderationService'
import styles from './ModerationStats.module.css'

/**
 * Dashboard showing moderation statistics and metrics
 */
export function ModerationStats() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['moderation-stats'],
    queryFn: () => moderationService.getStats(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000 // Refresh every 2 minutes
  })

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Loading statistics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Failed to load moderation statistics
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Moderation Overview</h3>
      
      <div className={styles.statsGrid}>
        {/* Pending Items */}
        <div className={`${styles.statCard} ${styles.pending}`}>
          <div className={styles.statValue}>{stats.pendingCount}</div>
          <div className={styles.statLabel}>Pending Review</div>
          <div className={styles.statDescription}>
            Items awaiting moderation
          </div>
        </div>

        {/* Flagged Items */}
        <div className={`${styles.statCard} ${styles.flagged}`}>
          <div className={styles.statValue}>{stats.flaggedCount}</div>
          <div className={styles.statLabel}>Flagged</div>
          <div className={styles.statDescription}>
            Items requiring attention
          </div>
        </div>

        {/* Today's Approvals */}
        <div className={`${styles.statCard} ${styles.approved}`}>
          <div className={styles.statValue}>{stats.approvedToday}</div>
          <div className={styles.statLabel}>Approved Today</div>
          <div className={styles.statDescription}>
            Items approved today
          </div>
        </div>

        {/* Today's Rejections */}
        <div className={`${styles.statCard} ${styles.rejected}`}>
          <div className={styles.statValue}>{stats.rejectedToday}</div>
          <div className={styles.statLabel}>Rejected Today</div>
          <div className={styles.statDescription}>
            Items rejected today
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Activity Today:</span>
          <span className={styles.summaryValue}>
            {stats.approvedToday + stats.rejectedToday} actions
          </span>
        </div>
        
        {stats.pendingCount > 0 && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Queue Status:</span>
            <span className={styles.summaryValue}>
              {stats.flaggedCount > 0 
                ? `${stats.flaggedCount} urgent, ${stats.pendingCount - stats.flaggedCount} normal`
                : `${stats.pendingCount} items in queue`
              }
            </span>
          </div>
        )}
      </div>
    </div>
  )
}