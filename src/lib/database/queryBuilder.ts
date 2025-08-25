/**
 * QueryBuilder provides a type-safe, fluent interface for database queries
 * with built-in visibility filtering and pagination.
 * 
 * @example Basic query
 * const songs = await new QueryBuilder(supabase, 'songs')
 *   .select('*')
 *   .eq('is_public', true)
 *   .execute()
 * 
 * @example With visibility filtering
 * const arrangements = await new QueryBuilder(supabase, 'arrangements')
 *   .select('*, songs(*)')
 *   .withVisibility({ userId: user.id, canModerate: false, roles: [], canAdmin: false })
 *   .paginate({ page: 1, limit: 20 })
 *   .execute()
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { 
  TableName, 
  TableRow, 
  TableInsert, 
  TableUpdate,
  UserPermissions,
  PaginationOptions,
  QueryResult,
  QueryBuilderOperation
} from './types'
import { DatabaseError, handleSupabaseError, NotFoundError } from './errors'
import { applyFilter } from './visibilityFilter'
import { calculateRange, formatPaginatedResponse, normalizePaginationOptions } from './paginationHelper'

export class QueryBuilder<T extends TableName> {
  private client: SupabaseClient
  private tableName: T
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private query: any
  private operation: QueryBuilderOperation = 'select'
  private selectColumns?: string
  private permissions?: UserPermissions
  private paginationOptions?: PaginationOptions
  private shouldGetCount = false
  private isSingle = false
  // private _currentLimit?: number // Unused, kept for potential future use

  constructor(client: SupabaseClient, tableName: T) {
    this.client = client
    this.tableName = tableName
    this.query = null
  }

  /**
   * Start a SELECT query
   * @param columns - Columns to select (default: '*')
   */
  select(columns = '*', options?: { count?: 'exact' | 'planned' | 'estimated' }): this {
    this.operation = 'select'
    this.selectColumns = columns
    this.query = this.client.from(this.tableName).select(columns, options)
    if (options?.count) {
      this.shouldGetCount = true
    }
    return this
  }

  /**
   * Start an INSERT operation
   * @param data - Data to insert
   */
  insert(data: TableInsert<T> | TableInsert<T>[]): this {
    this.operation = 'insert'
    this.query = this.client.from(this.tableName).insert(data)
    return this
  }

  /**
   * Start an UPDATE operation
   * @param data - Data to update
   */
  update(data: TableUpdate<T>): this {
    this.operation = 'update'
    this.query = this.client.from(this.tableName).update(data)
    return this
  }

  /**
   * Start a DELETE operation
   */
  delete(): this {
    this.operation = 'delete'
    this.query = this.client.from(this.tableName).delete()
    return this
  }

  /**
   * Start an UPSERT operation
   * @param data - Data to upsert
   * @param options - Upsert options
   */
  upsert(
    data: TableInsert<T> | TableInsert<T>[],
    options?: { onConflict?: string; ignoreDuplicates?: boolean }
  ): this {
    this.operation = 'upsert'
    this.query = this.client.from(this.tableName).upsert(data, options)
    return this
  }

  /**
   * Apply visibility filtering based on user permissions
   * @param permissions - User permissions object
   */
  withVisibility(permissions: UserPermissions): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized. Call select/insert/update/delete first.')
    }
    
    // Only apply visibility to SELECT operations
    if (this.operation === 'select') {
      this.permissions = permissions
      this.query = applyFilter(this.query, permissions)
    }
    
    return this
  }

  /**
   * Add pagination to the query
   * @param options - Pagination options
   */
  paginate(options: PaginationOptions): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized. Call select first.')
    }
    
    const normalized = normalizePaginationOptions(options)
    this.paginationOptions = normalized
    
    const { from, to } = calculateRange(normalized.page, normalized.limit)
    this.query = this.query.range(from, to)
    // this._currentLimit = normalized.limit
    
    // Enable count for pagination metadata
    if (this.operation === 'select' && !this.shouldGetCount) {
      // Re-create query with count option
      this.query = this.client
        .from(this.tableName)
        .select(this.selectColumns || '*', { count: 'exact' })
      
      // Re-apply filters
      if (this.permissions) {
        this.query = applyFilter(this.query, this.permissions)
      }
      
      // Re-apply range
      this.query = this.query.range(from, to)
      this.shouldGetCount = true
    }
    
    return this
  }

  /**
   * Filter by column equals value
   */
  eq(column: string, value: unknown): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.eq(column, value)
    return this
  }

  /**
   * Filter by column not equals value
   */
  neq(column: string, value: unknown): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.neq(column, value)
    return this
  }

  /**
   * Filter by column greater than value
   */
  gt(column: string, value: unknown): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.gt(column, value)
    return this
  }

  /**
   * Filter by column greater than or equal to value
   */
  gte(column: string, value: unknown): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.gte(column, value)
    return this
  }

  /**
   * Filter by column less than value
   */
  lt(column: string, value: unknown): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.lt(column, value)
    return this
  }

  /**
   * Filter by column less than or equal to value
   */
  lte(column: string, value: unknown): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.lte(column, value)
    return this
  }

  /**
   * Filter by column in array of values
   */
  in(column: string, values: unknown[]): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.in(column, values)
    return this
  }

  /**
   * Filter by column contains substring (case-insensitive)
   */
  ilike(column: string, pattern: string): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.ilike(column, pattern)
    return this
  }

  /**
   * Filter by column contains substring (case-sensitive)
   */
  like(column: string, pattern: string): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.like(column, pattern)
    return this
  }

  /**
   * Filter by array column contains values
   */
  contains(column: string, values: unknown[] | Record<string, unknown>): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.contains(column, values)
    return this
  }

  /**
   * Filter by array column overlaps with values
   */
  overlaps(column: string, values: unknown[]): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.overlaps(column, values)
    return this
  }

  /**
   * Add OR condition
   */
  or(filters: string): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.or(filters)
    return this
  }

  /**
   * Order results by column
   */
  orderBy(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.order(column, options)
    return this
  }

  /**
   * Limit number of results
   */
  limit(count: number): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.limit(count)
    // this._currentLimit = count
    return this
  }

  /**
   * Set range of results
   */
  range(from: number, to: number): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.range(from, to)
    return this
  }

  /**
   * Return single result
   */
  single(): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.isSingle = true
    this.query = this.query.single()
    return this
  }

  /**
   * Full text search (PostgreSQL specific)
   */
  textSearch(
    column: string, 
    query: string, 
    options?: { type?: 'plain' | 'phrase' | 'websearch'; config?: string }
  ): this {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }
    this.query = this.query.textSearch(column, query, options)
    return this
  }

  /**
   * Execute the query and return results
   */
  async execute(): Promise<QueryResult<TableRow<T>>> {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }

    try {
      const result = await this.query

      if (result.error) {
        throw handleSupabaseError(result.error)
      }

      // Handle single result that wasn't found
      if (this.isSingle && !result.data) {
        throw new NotFoundError('Record')
      }

      // Format response based on options
      if (this.paginationOptions && this.shouldGetCount && result.count !== null) {
        const paginatedResponse = formatPaginatedResponse(
          result.data || [],
          result.count,
          this.paginationOptions.page,
          this.paginationOptions.limit
        )
        
        return {
          data: paginatedResponse.data as TableRow<T> | TableRow<T>[] | null,
          error: null,
          count: result.count,
          pagination: paginatedResponse.pagination
        }
      }

      return {
        data: result.data as TableRow<T> | TableRow<T>[] | null,
        error: null,
        count: result.count ?? undefined
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        return {
          data: null,
          error
        }
      }
      
      const dbError = new DatabaseError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        500,
        'UNKNOWN_ERROR',
        error
      )
      
      return {
        data: null,
        error: dbError
      }
    }
  }

  /**
   * Execute and get count only (no data)
   */
  async count(): Promise<{ count: number | null; error: DatabaseError | null }> {
    if (!this.query) {
      throw new DatabaseError('Query not initialized.')
    }

    try {
      // Use head: true for count-only query
      const countQuery = this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
      
      // Apply visibility if set
      const filteredQuery = this.permissions 
        ? applyFilter(countQuery, this.permissions)
        : countQuery
      
      const result = await filteredQuery

      if (result.error) {
        throw handleSupabaseError(result.error)
      }

      return {
        count: result.count,
        error: null
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        return { count: null, error }
      }
      
      return {
        count: null,
        error: new DatabaseError(
          error instanceof Error ? error.message : 'Count failed',
          500,
          'COUNT_ERROR',
          error
        )
      }
    }
  }
}