import { useState, useEffect } from 'react'
import type { UserWithRole, RoleAssignment } from '../types/admin.types'
import type { UserRole } from '../../auth/types'
import styles from './RoleAssignmentModal.module.css'

interface RoleAssignmentModalProps {
  user: UserWithRole
  onAssign: (assignment: RoleAssignment) => Promise<void>
  onClose: () => void
  isAssigning: boolean
}

export function RoleAssignmentModal({ 
  user, 
  onAssign, 
  onClose, 
  isAssigning 
}: RoleAssignmentModalProps) {
  const [role, setRole] = useState<UserRole>(user.role)
  const [reason, setReason] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (role === user.role && !expiresAt) {
      setError('Please select a different role or set an expiration date')
      return
    }

    if (!reason.trim()) {
      setError('Please provide a reason for this role change')
      return
    }

    try {
      await onAssign({
        userId: user.id,
        role,
        reason: reason.trim(),
        expiresAt: expiresAt || undefined
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role')
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Change User Role</h3>
          <button 
            onClick={onClose} 
            className={styles.closeBtn}
            type="button"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className={styles.userInfo}>
          <div className={styles.userDetail}>
            <span className={styles.label}>User:</span>
            <span>{user.email}</span>
          </div>
          {user.fullName && (
            <div className={styles.userDetail}>
              <span className={styles.label}>Name:</span>
              <span>{user.fullName}</span>
            </div>
          )}
          <div className={styles.userDetail}>
            <span className={styles.label}>Current Role:</span>
            <span className={`${styles.roleBadge} ${styles[`role-${user.role}`]}`}>
              {user.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="role" className={styles.formLabel}>
              New Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={styles.select}
              disabled={isAssigning}
            >
              <option value="user">Regular User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="reason" className={styles.formLabel}>
              Reason for Change <span className={styles.required}>*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={styles.textarea}
              rows={3}
              placeholder="Explain why this role change is being made..."
              disabled={isAssigning}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="expiresAt" className={styles.formLabel}>
              Expiration Date (Optional)
            </label>
            <input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={styles.input}
              disabled={isAssigning}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className={styles.helpText}>
              Leave blank for permanent role assignment
            </p>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.notice}>
            <strong>Note:</strong> Role changes will take effect when the user refreshes their session 
            (typically within 1 hour). For immediate effect, the user should sign out and back in.
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={isAssigning}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isAssigning}
            >
              {isAssigning ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}