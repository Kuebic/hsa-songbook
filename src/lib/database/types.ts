/**
 * Type definitions for QueryBuilder and database operations
 */

import type { Database } from '../database.types'
import type { DatabaseError } from './errors'

export type TableName = keyof Database['public']['Tables']
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row']
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert']
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update']

export interface UserPermissions {
  userId?: string
  roles: string[]
  canModerate: boolean
  canAdmin: boolean
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface QueryResult<T> {
  data: T | T[] | null
  error: DatabaseError | null
  count?: number | null
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface FilterOptions {
  searchQuery?: string
  themes?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export type QueryBuilderOperation = 
  | 'select' 
  | 'insert' 
  | 'update' 
  | 'delete' 
  | 'upsert'

export interface QueryBuilderConfig {
  enableCache?: boolean
  cacheTTL?: number
  timeout?: number
}