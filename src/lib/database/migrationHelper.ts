/**
 * Migration helper for gradual QueryBuilder rollout
 * Provides feature flag control and performance monitoring
 */

import { QueryBuilder } from './queryBuilder'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserPermissions } from './types'

// Feature flag for QueryBuilder usage - controlled via environment variable
export const USE_QUERY_BUILDER = import.meta.env.VITE_USE_QUERY_BUILDER === 'true'

/**
 * Performance monitoring for query execution
 */
export class QueryPerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()

  static startTimer(): { stop: (operationName: string) => void } {
    const startTime = performance.now()
    
    return {
      stop: (operationName: string) => {
        const duration = performance.now() - startTime
        
        // Store metric
        const metrics = this.metrics.get(operationName) || []
        metrics.push(duration)
        this.metrics.set(operationName, metrics)
        
        // Log slow queries
        if (duration > 1000) {
          console.warn(`[SLOW QUERY] ${operationName}: ${duration.toFixed(2)}ms`)
        }
        
        // Log in development
        if (import.meta.env.DEV) {
          console.log(`[Query Performance] ${operationName}: ${duration.toFixed(2)}ms`)
        }
      }
    }
  }

  static getMetrics(operationName?: string): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {}
    
    const entries: [string, number[]][] = operationName 
      ? [[operationName, this.metrics.get(operationName) || []]] 
      : Array.from(this.metrics.entries())
    
    for (const [name, durations] of entries) {
      if (!durations || durations.length === 0) continue
      
      result[name] = {
        avg: durations.reduce((a: number, b: number) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        count: durations.length
      }
    }
    
    return result
  }

  static clearMetrics(): void {
    this.metrics.clear()
  }
}

/**
 * Helper to create QueryBuilder with consistent configuration
 */
export function createQueryBuilder<T extends import('./types').TableName>(
  supabase: SupabaseClient,
  tableName: T
): QueryBuilder<T> {
  return new QueryBuilder(supabase, tableName)
}

/**
 * Helper to build permissions object from user context
 */
export function buildUserPermissions(params: {
  userId?: string | null
  canModerate?: boolean
  canAdmin?: boolean
  roles?: string[]
}): UserPermissions {
  return {
    userId: params.userId || undefined,
    roles: params.roles || [],
    canModerate: params.canModerate || false,
    canAdmin: params.canAdmin || false
  }
}

/**
 * Migration wrapper for gradual rollout
 * Allows switching between legacy and QueryBuilder implementations
 */
export function withMigration<T>(
  operationName: string,
  legacyFn: () => Promise<T>,
  queryBuilderFn: () => Promise<T>
): Promise<T> {
  const timer = QueryPerformanceMonitor.startTimer()
  
  const executeOperation = async () => {
    if (USE_QUERY_BUILDER) {
      try {
        const result = await queryBuilderFn()
        timer.stop(`${operationName}_querybuilder`)
        return result
      } catch (error) {
        console.error(`[QueryBuilder Error] ${operationName}:`, error)
        // Optionally fall back to legacy in case of errors
        if (import.meta.env.VITE_QUERYBUILDER_FALLBACK === 'true') {
          console.warn(`[QueryBuilder Fallback] Using legacy implementation for ${operationName}`)
          const result = await legacyFn()
          timer.stop(`${operationName}_legacy_fallback`)
          return result
        }
        throw error
      }
    } else {
      const result = await legacyFn()
      timer.stop(`${operationName}_legacy`)
      return result
    }
  }
  
  return executeOperation()
}

/**
 * Log migration status on startup
 */
if (import.meta.env.DEV) {
  console.log(
    `[Migration Status] QueryBuilder is ${USE_QUERY_BUILDER ? 'ENABLED' : 'DISABLED'}`,
    '\nTo enable: Set VITE_USE_QUERY_BUILDER=true in .env'
  )
}