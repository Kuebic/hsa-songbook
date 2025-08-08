export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  dismissible?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

export interface NotificationContextValue {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => string
  removeNotification: (id: string) => void
  clearNotifications: () => void
}