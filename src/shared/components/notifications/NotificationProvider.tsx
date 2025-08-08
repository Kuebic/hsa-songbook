import { createContext, useState, useCallback, useRef } from 'react'
import type { Notification, NotificationContextValue } from './Notification.types'
import { NotificationContainer } from './NotificationContainer'

export const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    
    // Clear timeout if exists
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
  }, [])

  const addNotification = useCallback((
    notification: Omit<Notification, 'id'>
  ): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
      dismissible: notification.dismissible ?? true
    }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-dismiss after duration
    if (newNotification.duration && newNotification.duration > 0) {
      const timeout = setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
      
      timeoutsRef.current.set(id, timeout)
    }
    
    return id
  }, [removeNotification])
  
  const clearNotifications = useCallback(() => {
    setNotifications([])
    
    // Clear all timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    timeoutsRef.current.clear()
  }, [])
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications
      }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

