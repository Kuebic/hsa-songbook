import { createContext } from 'react'
import type { NotificationContextValue } from './Notification.types'

export const NotificationContext = createContext<NotificationContextValue | null>(null)