/**
 * Logger utility for environment-aware logging
 * Only logs in development mode to avoid exposing sensitive data in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: string
}

class Logger {
  private isDevelopment = import.meta.env.DEV

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`
  }

  private sanitizeData(data: unknown): unknown {
    if (!data) return data
    
    // Remove sensitive fields from objects
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data } as Record<string, unknown>
      const sensitiveKeys = ['password', 'token', 'secret', 'api_key', 'access_token', 'refresh_token']
      
      Object.keys(sanitized).forEach(key => {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '[REDACTED]'
        }
      })
      
      return sanitized
    }
    
    return data
  }

  debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message), this.sanitizeData(data))
    }
  }

  info(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message), this.sanitizeData(data))
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message), this.sanitizeData(data))
    }
  }

  error(message: string, error?: unknown): void {
    // Always log errors, but sanitize in production
    const sanitizedError = this.isDevelopment ? error : this.sanitizeData(error)
    console.error(this.formatMessage('error', message), sanitizedError)
    
    // In production, you might want to send errors to a monitoring service
    if (!this.isDevelopment && error instanceof Error) {
      // TODO: Send to Sentry, LogRocket, or other monitoring service
      // sendToMonitoring({ message, error: error.message, stack: error.stack })
    }
  }

  // Group related logs together
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(label)
    }
  }

  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd()
    }
  }

  // Performance timing
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label)
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label)
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export for testing purposes
export { Logger }