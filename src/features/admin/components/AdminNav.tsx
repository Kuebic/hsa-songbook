import styles from './AdminNav.module.css'

type TabType = 'users' | 'audit' | 'settings'

interface AdminNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export function AdminNav({ activeTab, onTabChange }: AdminNavProps) {
  const tabs: { id: TabType; label: string; description: string }[] = [
    { 
      id: 'users', 
      label: 'Users', 
      description: 'Manage user roles and permissions' 
    },
    { 
      id: 'audit', 
      label: 'Audit Log', 
      description: 'View role change history' 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      description: 'Configure admin settings (Coming soon)' 
    }
  ]

  return (
    <nav className={styles.nav}>
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            disabled={tab.id === 'settings'} // Disable settings for now
            title={tab.description}
          >
            <span className={styles.tabLabel}>{tab.label}</span>
            {tab.id === 'settings' && (
              <span className={styles.badge}>Soon</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}