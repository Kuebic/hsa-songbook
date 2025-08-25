/**
 * Pagination utilities for database queries
 */

import { ValidationError } from './errors'

export interface PaginationOptions {
  page: number
  limit: number
}

export interface PaginationRange {
  from: number
  to: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Maximum allowed items per page
 */
const MAX_LIMIT = 100

/**
 * Default items per page
 */
const DEFAULT_LIMIT = 20

/**
 * Calculate the range for Supabase's range() method
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Object with from and to indices for range query
 */
export function calculateRange(page: number, limit: number): PaginationRange {
  // Validate inputs
  if (page < 1) {
    throw new ValidationError('Page number must be 1 or greater', {
      page: 'Invalid page number'
    })
  }

  if (limit < 1) {
    throw new ValidationError('Limit must be 1 or greater', {
      limit: 'Invalid limit'
    })
  }

  if (limit > MAX_LIMIT) {
    throw new ValidationError(`Limit cannot exceed ${MAX_LIMIT}`, {
      limit: `Maximum limit is ${MAX_LIMIT}`
    })
  }

  // Calculate zero-based indices
  const offset = (page - 1) * limit
  const from = offset
  const to = offset + limit - 1

  return { from, to }
}

/**
 * Format a paginated response with metadata
 * @param data - The data array
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Formatted paginated response
 */
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit)
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
}

/**
 * Normalize pagination options with defaults
 * @param options - Partial pagination options
 * @returns Complete pagination options with defaults
 */
export function normalizePaginationOptions(
  options?: Partial<PaginationOptions>
): PaginationOptions {
  const page = options?.page ?? 1
  const limit = options?.limit ?? DEFAULT_LIMIT

  // Validate and clamp values
  const normalizedPage = Math.max(1, Math.floor(page))
  const normalizedLimit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)))

  return {
    page: normalizedPage,
    limit: normalizedLimit
  }
}

/**
 * Build pagination metadata without data
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Pagination metadata
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginatedResponse<never>['pagination'] {
  const totalPages = Math.ceil(total / limit)
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

/**
 * Calculate offset from page and limit
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @returns Zero-based offset
 */
export function calculateOffset(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * Math.max(1, limit)
}

/**
 * Parse pagination from query parameters or request
 * @param params - Object containing page and limit as strings or numbers
 * @returns Normalized pagination options
 */
export function parsePaginationParams(
  params: Record<string, string | number | undefined>
): PaginationOptions {
  let page = 1
  let limit = DEFAULT_LIMIT

  if (params.page) {
    const parsedPage = typeof params.page === 'string' ? parseInt(params.page, 10) : params.page
    page = isNaN(parsedPage) ? 1 : parsedPage
  }
  
  if (params.limit) {
    const parsedLimit = typeof params.limit === 'string' ? parseInt(params.limit, 10) : params.limit
    limit = isNaN(parsedLimit) ? DEFAULT_LIMIT : parsedLimit
  }

  return normalizePaginationOptions({ page, limit })
}