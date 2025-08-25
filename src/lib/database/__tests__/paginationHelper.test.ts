/**
 * Unit tests for pagination utilities
 * Tests range calculations, response formatting, and edge cases
 */

import { describe, it, expect } from 'vitest'
import {
  calculateRange,
  formatPaginatedResponse,
  normalizePaginationOptions,
  buildPaginationMeta,
  calculateOffset,
  parsePaginationParams,
  type PaginationOptions,
  type PaginatedResponse
} from '../paginationHelper'
import { ValidationError } from '../errors'

describe('paginationHelper', () => {
  describe('calculateRange', () => {
    it('should calculate correct range for first page', () => {
      const result = calculateRange(1, 10)
      expect(result).toEqual({ from: 0, to: 9 })
    })

    it('should calculate correct range for second page', () => {
      const result = calculateRange(2, 10)
      expect(result).toEqual({ from: 10, to: 19 })
    })

    it('should calculate correct range for page with different limit', () => {
      const result = calculateRange(3, 5)
      expect(result).toEqual({ from: 10, to: 14 })
    })

    it('should handle single item pages', () => {
      const result = calculateRange(5, 1)
      expect(result).toEqual({ from: 4, to: 4 })
    })

    it('should handle large page numbers', () => {
      const result = calculateRange(100, 20)
      expect(result).toEqual({ from: 1980, to: 1999 })
    })

    describe('validation', () => {
      it('should throw ValidationError for page < 1', () => {
        expect(() => calculateRange(0, 10)).toThrow(ValidationError)
        expect(() => calculateRange(-1, 10)).toThrow(ValidationError)
        expect(() => calculateRange(-10, 10)).toThrow(ValidationError)
      })

      it('should provide helpful error message for invalid page', () => {
        expect(() => calculateRange(0, 10)).toThrow('Page number must be 1 or greater')
      })

      it('should throw ValidationError for limit < 1', () => {
        expect(() => calculateRange(1, 0)).toThrow(ValidationError)
        expect(() => calculateRange(1, -1)).toThrow(ValidationError)
        expect(() => calculateRange(1, -10)).toThrow(ValidationError)
      })

      it('should provide helpful error message for invalid limit', () => {
        expect(() => calculateRange(1, 0)).toThrow('Limit must be 1 or greater')
      })

      it('should throw ValidationError for limit > 100', () => {
        expect(() => calculateRange(1, 101)).toThrow(ValidationError)
        expect(() => calculateRange(1, 1000)).toThrow(ValidationError)
      })

      it('should provide helpful error message for limit too high', () => {
        expect(() => calculateRange(1, 101)).toThrow('Limit cannot exceed 100')
      })

      it('should accept maximum valid limit', () => {
        const result = calculateRange(1, 100)
        expect(result).toEqual({ from: 0, to: 99 })
      })

      it('should accept minimum valid inputs', () => {
        const result = calculateRange(1, 1)
        expect(result).toEqual({ from: 0, to: 0 })
      })
    })
  })

  describe('formatPaginatedResponse', () => {
    const sampleData = [
      { id: 1, title: 'Song 1' },
      { id: 2, title: 'Song 2' },
      { id: 3, title: 'Song 3' }
    ]

    it('should format response with correct pagination metadata', () => {
      const result = formatPaginatedResponse(sampleData, 50, 1, 10)

      expect(result.data).toBe(sampleData)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNext: true,
        hasPrev: false
      })
    })

    it('should calculate totalPages correctly', () => {
      // Exact division
      let result = formatPaginatedResponse(sampleData, 20, 1, 10)
      expect(result.pagination.totalPages).toBe(2)

      // With remainder
      result = formatPaginatedResponse(sampleData, 25, 1, 10)
      expect(result.pagination.totalPages).toBe(3)

      // Single page
      result = formatPaginatedResponse(sampleData, 5, 1, 10)
      expect(result.pagination.totalPages).toBe(1)
    })

    it('should set hasNext correctly', () => {
      // First page with more pages
      let result = formatPaginatedResponse(sampleData, 50, 1, 10)
      expect(result.pagination.hasNext).toBe(true)

      // Middle page
      result = formatPaginatedResponse(sampleData, 50, 3, 10)
      expect(result.pagination.hasNext).toBe(true)

      // Last page
      result = formatPaginatedResponse(sampleData, 50, 5, 10)
      expect(result.pagination.hasNext).toBe(false)

      // Single page
      result = formatPaginatedResponse(sampleData, 5, 1, 10)
      expect(result.pagination.hasNext).toBe(false)
    })

    it('should set hasPrev correctly', () => {
      // First page
      let result = formatPaginatedResponse(sampleData, 50, 1, 10)
      expect(result.pagination.hasPrev).toBe(false)

      // Second page
      result = formatPaginatedResponse(sampleData, 50, 2, 10)
      expect(result.pagination.hasPrev).toBe(true)

      // Last page
      result = formatPaginatedResponse(sampleData, 50, 5, 10)
      expect(result.pagination.hasPrev).toBe(true)
    })

    it('should handle empty data', () => {
      const result = formatPaginatedResponse([], 0, 1, 10)

      expect(result.data).toEqual([])
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      })
    })

    it('should handle total of 0', () => {
      const result = formatPaginatedResponse(sampleData, 0, 1, 10)

      expect(result.pagination.totalPages).toBe(0)
      expect(result.pagination.hasNext).toBe(false)
      expect(result.pagination.hasPrev).toBe(false)
    })

    it('should preserve data reference', () => {
      const result = formatPaginatedResponse(sampleData, 50, 1, 10)
      expect(result.data).toBe(sampleData)
    })
  })

  describe('normalizePaginationOptions', () => {
    it('should return default values when no options provided', () => {
      const result = normalizePaginationOptions()
      expect(result).toEqual({ page: 1, limit: 20 })
    })

    it('should return default values for empty object', () => {
      const result = normalizePaginationOptions({})
      expect(result).toEqual({ page: 1, limit: 20 })
    })

    it('should use provided valid values', () => {
      const result = normalizePaginationOptions({ page: 5, limit: 15 })
      expect(result).toEqual({ page: 5, limit: 15 })
    })

    it('should normalize negative page to 1', () => {
      const result = normalizePaginationOptions({ page: -5, limit: 10 })
      expect(result).toEqual({ page: 1, limit: 10 })
    })

    it('should normalize zero page to 1', () => {
      const result = normalizePaginationOptions({ page: 0, limit: 10 })
      expect(result).toEqual({ page: 1, limit: 10 })
    })

    it('should normalize decimal page to integer', () => {
      const result = normalizePaginationOptions({ page: 3.7, limit: 10 })
      expect(result).toEqual({ page: 3, limit: 10 })
    })

    it('should normalize negative limit to 1', () => {
      const result = normalizePaginationOptions({ page: 2, limit: -10 })
      expect(result).toEqual({ page: 2, limit: 1 })
    })

    it('should normalize zero limit to 1', () => {
      const result = normalizePaginationOptions({ page: 2, limit: 0 })
      expect(result).toEqual({ page: 2, limit: 1 })
    })

    it('should clamp limit to maximum of 100', () => {
      const result = normalizePaginationOptions({ page: 1, limit: 150 })
      expect(result).toEqual({ page: 1, limit: 100 })
    })

    it('should normalize decimal limit to integer', () => {
      const result = normalizePaginationOptions({ page: 1, limit: 15.8 })
      expect(result).toEqual({ page: 1, limit: 15 })
    })

    it('should use default for undefined values', () => {
      const result = normalizePaginationOptions({ page: undefined, limit: undefined })
      expect(result).toEqual({ page: 1, limit: 20 })
    })

    it('should handle partial options', () => {
      let result = normalizePaginationOptions({ page: 3 })
      expect(result).toEqual({ page: 3, limit: 20 })

      result = normalizePaginationOptions({ limit: 25 })
      expect(result).toEqual({ page: 1, limit: 25 })
    })
  })

  describe('buildPaginationMeta', () => {
    it('should build pagination metadata without data', () => {
      const result = buildPaginationMeta(50, 3, 10)

      expect(result).toEqual({
        page: 3,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNext: true,
        hasPrev: true
      })
    })

    it('should handle edge cases', () => {
      // First page
      let result = buildPaginationMeta(50, 1, 10)
      expect(result.hasPrev).toBe(false)
      expect(result.hasNext).toBe(true)

      // Last page
      result = buildPaginationMeta(50, 5, 10)
      expect(result.hasPrev).toBe(true)
      expect(result.hasNext).toBe(false)

      // Single page
      result = buildPaginationMeta(5, 1, 10)
      expect(result.hasPrev).toBe(false)
      expect(result.hasNext).toBe(false)
      expect(result.totalPages).toBe(1)
    })

    it('should handle zero total', () => {
      const result = buildPaginationMeta(0, 1, 10)

      expect(result.totalPages).toBe(0)
      expect(result.hasNext).toBe(false)
      expect(result.hasPrev).toBe(false)
    })
  })

  describe('calculateOffset', () => {
    it('should calculate correct offset for various pages', () => {
      expect(calculateOffset(1, 10)).toBe(0)
      expect(calculateOffset(2, 10)).toBe(10)
      expect(calculateOffset(3, 10)).toBe(20)
      expect(calculateOffset(5, 15)).toBe(60)
    })

    it('should handle edge cases', () => {
      expect(calculateOffset(1, 1)).toBe(0)
      expect(calculateOffset(100, 20)).toBe(1980)
    })

    it('should normalize negative or zero page to 1', () => {
      expect(calculateOffset(0, 10)).toBe(0)
      expect(calculateOffset(-5, 10)).toBe(0)
    })

    it('should normalize negative or zero limit to 1', () => {
      expect(calculateOffset(3, 0)).toBe(2)
      expect(calculateOffset(3, -10)).toBe(2)
    })
  })

  describe('parsePaginationParams', () => {
    it('should parse valid string parameters', () => {
      const params = { page: '3', limit: '15' }
      const result = parsePaginationParams(params)
      expect(result).toEqual({ page: 3, limit: 15 })
    })

    it('should parse valid number parameters', () => {
      const params = { page: 5, limit: 25 }
      const result = parsePaginationParams(params)
      expect(result).toEqual({ page: 5, limit: 25 })
    })

    it('should use defaults for missing parameters', () => {
      let result = parsePaginationParams({})
      expect(result).toEqual({ page: 1, limit: 20 })

      result = parsePaginationParams({ page: '2' })
      expect(result).toEqual({ page: 2, limit: 20 })

      result = parsePaginationParams({ limit: '30' })
      expect(result).toEqual({ page: 1, limit: 30 })
    })

    it('should handle undefined parameters', () => {
      const params = { page: undefined, limit: undefined }
      const result = parsePaginationParams(params)
      expect(result).toEqual({ page: 1, limit: 20 })
    })

    it('should handle invalid string numbers', () => {
      const params = { page: 'invalid', limit: 'also-invalid' }
      const result = parsePaginationParams(params)
      
      // parseInt will return NaN, which should be normalized
      expect(result.page).toBe(1) // Normalized from NaN
      expect(result.limit).toBe(20) // Normalized from NaN
    })

    it('should handle mixed valid and invalid parameters', () => {
      let params = { page: '5', limit: 'invalid' }
      let result = parsePaginationParams(params)
      expect(result.page).toBe(5)
      expect(result.limit).toBe(20) // Default because NaN

      params = { page: 'invalid', limit: '15' }
      result = parsePaginationParams(params)
      expect(result.page).toBe(1) // Default because NaN
      expect(result.limit).toBe(15)
    })

    it('should normalize parsed values', () => {
      // Values that need clamping
      const params = { page: '0', limit: '150' }
      const result = parsePaginationParams(params)
      expect(result).toEqual({ page: 1, limit: 100 })
    })

    it('should handle decimal strings', () => {
      const params = { page: '3.7', limit: '15.9' }
      const result = parsePaginationParams(params)
      expect(result).toEqual({ page: 3, limit: 15 })
    })

    it('should handle additional parameters in object', () => {
      const params = { 
        page: '2', 
        limit: '10', 
        search: 'query', 
        sort: 'title',
        other: 'value'
      }
      const result = parsePaginationParams(params)
      expect(result).toEqual({ page: 2, limit: 10 })
    })
  })

  describe('type checking', () => {
    it('should have correct PaginationOptions type', () => {
      const options: PaginationOptions = { page: 1, limit: 20 }
      expect(options.page).toBe(1)
      expect(options.limit).toBe(20)
    })

    it('should have correct PaginatedResponse type', () => {
      const response: PaginatedResponse<{ id: number }> = {
        data: [{ id: 1 }],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      }
      expect(response.data[0].id).toBe(1)
      expect(response.pagination.page).toBe(1)
    })
  })

  describe('constants and limits', () => {
    it('should respect MAX_LIMIT constant', () => {
      // Test that normalization enforces the limit
      const result = normalizePaginationOptions({ page: 1, limit: 1000 })
      expect(result.limit).toBe(100)
    })

    it('should use DEFAULT_LIMIT constant', () => {
      const result = normalizePaginationOptions({ page: 1 })
      expect(result.limit).toBe(20)
    })

    it('should enforce MAX_LIMIT in calculateRange', () => {
      expect(() => calculateRange(1, 101)).toThrow('Limit cannot exceed 100')
    })
  })
})