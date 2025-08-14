import { useNotification } from './useNotification'
import type { Notification, NotificationType } from './Notification.types'

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification()
  
  if (notifications.length === 0) return null
  
  const containerStyles: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '400px',
    pointerEvents: 'none'
  }
  
  return (
    <div style={containerStyles} role="region" aria-label="Notifications">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

function NotificationItem({
  notification,
  onDismiss
}: {
  notification: Notification
  onDismiss: () => void
}) {
  const getTypeStyles = (type: NotificationType): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      animation: 'slideIn 0.3s ease-out',
      pointerEvents: 'auto',
      minWidth: '300px'
    }
    
    const typeStyles: Record<NotificationType, React.CSSProperties> = {
      success: {
        backgroundColor: 'var(--status-success)',
        color: 'var(--color-primary-foreground)'
      },
      error: {
        backgroundColor: 'var(--status-error)',
        color: 'var(--color-primary-foreground)'
      },
      warning: {
        backgroundColor: 'var(--status-warning)',
        color: 'var(--color-primary-foreground)'
      },
      info: {
        backgroundColor: 'var(--status-info)',
        color: 'var(--color-primary-foreground)'
      }
    }
    
    return { ...baseStyles, ...typeStyles[type] }
  }
  
  const getIcon = (type: NotificationType): string => {
    const icons: Record<NotificationType, string> = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }
    return icons[type]
  }
  
  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      
      <div
        style={getTypeStyles(notification.type)}
        role="alert"
        aria-live="polite"
      >
        <span style={{ fontSize: '20px' }}>{getIcon(notification.type)}</span>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {notification.title}
          </div>
          {notification.message && (
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {notification.message}
            </div>
          )}
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                color: 'var(--color-primary-foreground)',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {notification.action.label}
            </button>
          )}
        </div>
        
        {notification.dismissible && (
          <button
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-primary-foreground)',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '0',
              opacity: 0.8
            }}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        )}
      </div>
    </>
  )
}