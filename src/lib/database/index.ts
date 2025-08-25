/**
 * Database utilities for HSA Songbook
 * 
 * Provides a centralized, type-safe QueryBuilder with visibility filtering
 * and pagination support for all database operations.
 * 
 * @module @lib/database
 */

// Main QueryBuilder class
export { QueryBuilder } from './queryBuilder'

// Types and interfaces
export type {
  TableName,
  TableRow,
  TableInsert,
  TableUpdate,
  UserPermissions,
  PaginationOptions,
  QueryResult,
  FilterOptions,
  QueryBuilderOperation,
  QueryBuilderConfig
} from './types'

// Error classes
export {
  DatabaseError,
  NetworkError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  TimeoutError,
  handleSupabaseError
} from './errors'

// Pagination utilities
export {
  calculateRange,
  formatPaginatedResponse,
  normalizePaginationOptions,
  buildPaginationMeta,
  calculateOffset,
  parsePaginationParams,
  type PaginationRange,
  type PaginatedResponse
} from './paginationHelper'

// Visibility filtering
export {
  applyFilter,
  forPublicUser,
  forAuthenticatedUser,
  forModerator,
  isRecordVisible,
  buildVisibilitySQL,
  createClientFilter
} from './visibilityFilter'

// Note: Default export removed due to TypeScript issues with module resolution