/**
 * Logger Service
 * Structured logging for the HSA Songbook backend
 */

import { inspect } from 'util'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogMetadata {
  timestamp: string
  level: string
  context?: string
  [key: string]: any
}

class Logger {
  private context: string
  private logLevel: LogLevel

  constructor(context?: string) {
    this.context = context || 'App'
    this.logLevel = this.getLogLevelFromEnv()
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase()
    switch (level) {
      case 'DEBUG':
        return LogLevel.DEBUG
      case 'INFO':
        return LogLevel.INFO
      case 'WARN':
        return LogLevel.WARN
      case 'ERROR':
        return LogLevel.ERROR
      default:
        return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
    }
  }

  private formatMessage(level: string, message: string, metadata?: any): string {
    const logData: LogMetadata = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message
    }

    if (metadata) {
      logData.metadata = metadata
    }

    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(logData)
    }

    // Development-friendly format
    const levelColor = this.getLevelColor(level)
    const contextColor = '\x1b[36m' // Cyan
    const reset = '\x1b[0m'
    
    let output = `${logData.timestamp} ${levelColor}[${level}]${reset} ${contextColor}[${this.context}]${reset} ${message}`
    
    if (metadata) {
      output += '\n' + inspect(metadata, { colors: true, depth: 3 })
    }
    
    return output
  }

  private getLevelColor(level: string): string {
    switch (level) {
      case 'DEBUG':
        return '\x1b[35m' // Magenta
      case 'INFO':
        return '\x1b[32m' // Green
      case 'WARN':
        return '\x1b[33m' // Yellow
      case 'ERROR':
        return '\x1b[31m' // Red
      default:
        return '\x1b[0m' // Reset
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  debug(message: string, metadata?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, metadata))
    }
  }

  info(message: string, metadata?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message, metadata))
    }
  }

  warn(message: string, metadata?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, metadata))
    }
  }

  error(message: string, error?: Error | any, metadata?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorData = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error

      console.error(this.formatMessage('ERROR', message, { ...metadata, error: errorData }))
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`)
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, durationMs: number, metadata?: any): void {
    this.info(`Performance: ${operation}`, {
      durationMs,
      ...metadata
    })
  }

  /**
   * Log database operations
   */
  database(operation: string, collection: string, metadata?: any): void {
    this.debug(`Database ${operation}: ${collection}`, metadata)
  }

  /**
   * Log HTTP requests
   */
  http(method: string, path: string, statusCode: number, durationMs: number, metadata?: any): void {
    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO'
    
    if (this.shouldLog(level === 'ERROR' ? LogLevel.ERROR : level === 'WARN' ? LogLevel.WARN : LogLevel.INFO)) {
      console.log(this.formatMessage(level, `${method} ${path} ${statusCode}`, {
        method,
        path,
        statusCode,
        durationMs,
        ...metadata
      }))
    }
  }
}

// Export factory function for creating loggers
export function createLogger(context?: string): Logger {
  return new Logger(context)
}

// Export default logger instance
export const logger = createLogger()

// Export type for dependency injection
export type ILogger = Logger