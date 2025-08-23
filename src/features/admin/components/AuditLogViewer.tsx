import { useState } from 'react'
import { useAuditLog } from '../hooks/useAuditLog'
import type { AuditLogEntry } from '../types/admin.types'
import styles from './AuditLogViewer.module.css'

export function AuditLogViewer() {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>()
  const { data: auditEntries, isLoading, error } = useAuditLog(selectedUserId)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getActionIcon = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'grant':
        return '✓'
      case 'revoke':
        return '✗'
      case 'expire':
        return '⏰'
      default:
        return '•'
    }
  }

  const getActionColor = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'grant':
        return styles.actionGrant
      case 'revoke':
        return styles.actionRevoke
      case 'expire':
        return styles.actionExpire
      default:
        return ''
    }
  }

  const handleExport = () => {
    if (!auditEntries || auditEntries.length === 0) return

    const csv = [
      ['Date', 'Action', 'User', 'Role', 'Performed By', 'Reason'].join(','),
      ...auditEntries.map(entry => [
        formatDate(entry.performedAt),
        entry.action,
        entry.userEmail,
        entry.role,
        entry.performedByEmail,
        entry.reason || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearFilter = () => {
    setSelectedUserId(undefined)
  }

  if (isLoading) {
    return <div className={styles.loading}>Loading audit log...</div>
  }

  if (error) {
    return <div className={styles.error}>Error loading audit log: {error.message}</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Audit Log</h2>
        <div className={styles.actions}>
          {selectedUserId && (
            <button onClick={handleClearFilter} className={styles.clearFilterBtn}>
              Clear Filter
            </button>
          )}
          <button 
            onClick={handleExport} 
            className={styles.exportBtn}
            disabled={!auditEntries || auditEntries.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      {selectedUserId && (
        <div className={styles.filterNotice}>
          Showing entries for a specific user. 
          <button onClick={handleClearFilter} className={styles.clearLink}>
            Show all entries
          </button>
        </div>
      )}

      <div className={styles.timeline}>
        {auditEntries && auditEntries.length > 0 ? (
          auditEntries.map((entry) => (
            <div key={entry.id} className={styles.entry}>
              <div className={`${styles.icon} ${getActionColor(entry.action)}`}>
                {getActionIcon(entry.action)}
              </div>
              <div className={styles.content}>
                <div className={styles.entryHeader}>
                  <span className={styles.timestamp}>
                    {formatDate(entry.performedAt)}
                  </span>
                  <span className={`${styles.action} ${getActionColor(entry.action)}`}>
                    {entry.action.toUpperCase()}
                  </span>
                </div>
                <div className={styles.entryBody}>
                  <div className={styles.detail}>
                    <strong>{entry.performedByEmail}</strong> {entry.action === 'grant' ? 'assigned' : 'removed'} the{' '}
                    <span className={`${styles.roleBadge} ${styles[`role-${entry.role}`]}`}>
                      {entry.role}
                    </span>{' '}
                    role {entry.action === 'grant' ? 'to' : 'from'}{' '}
                    <button
                      onClick={() => setSelectedUserId(entry.userId)}
                      className={styles.userLink}
                      title="Filter by this user"
                    >
                      {entry.userEmail}
                    </button>
                  </div>
                  {entry.reason && (
                    <div className={styles.reason}>
                      <strong>Reason:</strong> {entry.reason}
                    </div>
                  )}
                  {entry.metadata && typeof entry.metadata === 'object' && 'expires_at' in entry.metadata && (
                    <div className={styles.metadata}>
                      <strong>Expires:</strong> {formatDate(String(entry.metadata.expires_at))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            No audit log entries found
          </div>
        )}
      </div>

      {auditEntries && auditEntries.length >= 100 && (
        <div className={styles.notice}>
          Showing the most recent 100 entries. Export to CSV for the complete history.
        </div>
      )}
    </div>
  )
}