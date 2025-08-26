import type { ErrorInfo } from 'react'

export type ErrorCategory = 
  | 'network'       // Network/API failures
  | 'chunk'         // Lazy loading failures
  | 'permission'    // Auth/authorization errors
  | 'validation'    // Input validation errors
  | 'parsing'       // Data parsing errors
  | 'component'     // React component errors
  | 'unknown'       // Uncategorized errors

export type ErrorLevel = 'app' | 'page' | 'section' | 'component'

export interface ErrorContext {
  category: ErrorCategory
  component?: string
  userId?: string
  action?: string // What user was trying to do
  retryable: boolean
  retryCount: number
  timestamp: number
  level?: ErrorLevel
  feature?: string
}

export interface RecoveryStrategy {
  type: 'auto' | 'manual' | 'none'
  maxRetries: number
  retryDelay: number // ms
  fallbackAction?: () => void
}

export interface CategorizedError extends Error {
  category: ErrorCategory
  context: ErrorContext
  recovery: RecoveryStrategy
}

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
  isRecovering: boolean
  recoveryDelay?: number
}

export interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  context?: ErrorContext
  level?: ErrorLevel
  featureName?: string
}

export interface FeatureErrorBoundaryProps {
  children: React.ReactNode
  featureName: string
  fallbackComponent?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: ErrorLevel
  resetKeys?: Array<string | number>
  isolate?: boolean
}

export interface ErrorReportData {
  error: Error | CategorizedError
  errorInfo?: ErrorInfo
  level?: ErrorLevel
  category?: ErrorCategory
  feature?: string
  context?: ErrorContext
}

export interface ErrorRecoveryMetrics {
  totalErrors: number
  recoveryAttempts: number
  successfulRecoveries: number
  failedRecoveries: number
  errorsByCategory: Record<ErrorCategory, number>
  recoveryRateByCategory: Record<ErrorCategory, number>
}