import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { UserList } from '../../features/admin/components/UserList'
import { AuditLogViewer } from '../../features/admin/components/AuditLogViewer'
import { AdminNav } from '../../features/admin/components/AdminNav'
import { useAdminStats } from '../../features/admin/hooks/useUsers'
import styles from './AdminDashboard.module.css'

export function AdminDashboard() {
  const { isLoaded, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'settings'>('users')
  const { data: stats } = useAdminStats()

  if (!isLoaded) {
    return (
      <div className={styles.loading}>
        Loading...
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        {stats && (
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.totalUsers}</span>
              <span className={styles.statLabel}>Total Users</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.adminCount}</span>
              <span className={styles.statLabel}>Admins</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.moderatorCount}</span>
              <span className={styles.statLabel}>Moderators</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.recentRoleChanges}</span>
              <span className={styles.statLabel}>Recent Changes</span>
            </div>
          </div>
        )}
      </div>
      
      <AdminNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className={styles.content}>
        {activeTab === 'users' && <UserList />}
        {activeTab === 'audit' && <AuditLogViewer />}
        {activeTab === 'settings' && (
          <div className={styles.comingSoon}>
            <h2>Settings</h2>
            <p>Admin settings configuration coming soon.</p>
          </div>
        )}
      </div>
      
      <div className={styles.notice}>
        <strong>Important:</strong> Role changes take effect when users refresh their session 
        (typically within 1 hour). For immediate effect, users should sign out and back in.
      </div>
    </div>
  )
}