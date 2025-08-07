import { expect } from 'vitest'
import mongoose from 'mongoose'

// ============================================================================
// MongoDB Document Matchers
// ============================================================================

/**
 * Check if value is a valid MongoDB ObjectId
 */
export const toBeValidObjectId = (received: any) => {
  const isValid = mongoose.Types.ObjectId.isValid(received)
  
  return {
    pass: isValid,
    message: () => isValid
      ? `Expected ${received} not to be a valid ObjectId`
      : `Expected ${received} to be a valid ObjectId`
  }
}

/**
 * Check if document has required MongoDB fields
 */
export const toHaveMongoFields = (received: any, fields: string[] = ['_id', 'createdAt', 'updatedAt']) => {
  const missing = fields.filter(field => !(field in received))
  const hasAllFields = missing.length === 0
  
  return {
    pass: hasAllFields,
    message: () => hasAllFields
      ? `Expected document not to have fields: ${fields.join(', ')}`
      : `Expected document to have missing fields: ${missing.join(', ')}`
  }
}

/**
 * Check if value is a Buffer (for compressed data)
 */
export const toBeBuffer = (received: any) => {
  const isBuffer = Buffer.isBuffer(received)
  
  return {
    pass: isBuffer,
    message: () => isBuffer
      ? `Expected ${received} not to be a Buffer`
      : `Expected ${received} to be a Buffer`
  }
}

/**
 * Check compression ratio within range
 */
export const toHaveCompressionRatio = (received: any, min: number, max: number = 100) => {
  const ratio = received?.compressionMetrics?.ratio
  const isInRange = ratio >= min && ratio <= max
  
  return {
    pass: isInRange,
    message: () => isInRange
      ? `Expected compression ratio ${ratio} not to be between ${min} and ${max}`
      : `Expected compression ratio ${ratio} to be between ${min} and ${max}`
  }
}

/**
 * Check if user has valid structure
 */
export const toBeValidUser = (received: any) => {
  const requiredFields = ['clerkId', 'email', 'username', 'role', 'preferences', 'stats']
  const hasRequiredFields = requiredFields.every(field => field in received)
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received.email)
  const hasValidRole = ['USER', 'ADMIN', 'MODERATOR'].includes(received.role)
  
  const isValid = hasRequiredFields && hasValidEmail && hasValidRole
  
  let failureReason = ''
  if (!hasRequiredFields) {
    const missing = requiredFields.filter(field => !(field in received))
    failureReason = `Missing required fields: ${missing.join(', ')}`
  } else if (!hasValidEmail) {
    failureReason = `Invalid email format: ${received.email}`
  } else if (!hasValidRole) {
    failureReason = `Invalid role: ${received.role}`
  }
  
  return {
    pass: isValid,
    message: () => isValid
      ? `Expected user not to be valid`
      : `Expected user to be valid. ${failureReason}`
  }
}

/**
 * Check if song has valid structure
 */
export const toBeValidSong = (received: any) => {
  const requiredFields = ['title', 'slug', 'metadata']
  const hasRequiredFields = requiredFields.every(field => field in received)
  const hasValidMetadata = received.metadata && 
    'createdBy' in received.metadata &&
    'ratings' in received.metadata &&
    'views' in received.metadata
  
  const isValid = hasRequiredFields && hasValidMetadata
  
  return {
    pass: isValid,
    message: () => isValid
      ? `Expected song not to be valid`
      : `Expected song to be valid with required fields and metadata`
  }
}

/**
 * Check if arrangement has valid structure
 */
export const toBeValidArrangement = (received: any) => {
  const requiredFields = ['name', 'songIds', 'slug', 'chordData', 'difficulty', 'metadata']
  const hasRequiredFields = requiredFields.every(field => field in received)
  const hasValidDifficulty = ['beginner', 'intermediate', 'advanced'].includes(received.difficulty)
  const hasValidChordData = Buffer.isBuffer(received.chordData)
  
  const isValid = hasRequiredFields && hasValidDifficulty && hasValidChordData
  
  return {
    pass: isValid,
    message: () => isValid
      ? `Expected arrangement not to be valid`
      : `Expected arrangement to be valid with required fields, valid difficulty, and Buffer chord data`
  }
}

/**
 * Check pagination response structure
 */
export const toHaveValidPagination = (received: any) => {
  const hasPagination = 'pagination' in received
  const hasRequiredPaginationFields = hasPagination && 
    'page' in received.pagination &&
    'limit' in received.pagination &&
    'total' in received.pagination &&
    'totalPages' in received.pagination
  
  const isValid = hasPagination && hasRequiredPaginationFields
  
  return {
    pass: isValid,
    message: () => isValid
      ? `Expected response not to have valid pagination`
      : `Expected response to have valid pagination with page, limit, total, and totalPages`
  }
}

/**
 * Check error response structure
 */
export const toHaveErrorStructure = (received: any) => {
  const hasSuccess = 'success' in received && received.success === false
  const hasError = 'error' in received && typeof received.error === 'string'
  
  const isValid = hasSuccess && hasError
  
  return {
    pass: isValid,
    message: () => isValid
      ? `Expected response not to have error structure`
      : `Expected response to have error structure with success: false and error message`
  }
}

/**
 * Check API response structure
 */
export const toHaveApiResponseStructure = (received: any, expectData: boolean = true) => {
  const hasSuccess = 'success' in received
  const hasMessage = 'message' in received
  const hasData = expectData ? 'data' in received : true
  
  const isValid = hasSuccess && hasMessage && hasData
  
  return {
    pass: isValid,
    message: () => isValid
      ? `Expected response not to have API response structure`
      : `Expected response to have API response structure with success, message${expectData ? ', and data' : ''}`
  }
}

// ============================================================================
// Performance Matchers
// ============================================================================

/**
 * Check execution time
 */
export const toExecuteWithin = (_received: () => Promise<any>, _timeLimit: number) => {
  return {
    pass: false,
    message: () => `Use this matcher with async functions: await expect(async () => { ... }).toExecuteWithin(1000)`
  }
}

/**
 * Check memory usage
 */
export const toUseMemoryWithin = (_received: any, memoryLimit: number) => {
  const memoryUsage = process.memoryUsage().heapUsed
  const isWithinLimit = memoryUsage <= memoryLimit
  
  return {
    pass: isWithinLimit,
    message: () => isWithinLimit
      ? `Expected memory usage ${memoryUsage} not to be within ${memoryLimit} bytes`
      : `Expected memory usage ${memoryUsage} to be within ${memoryLimit} bytes`
  }
}

// ============================================================================
// Register Custom Matchers
// ============================================================================

// Extend expect with custom matchers
expect.extend({
  toBeValidObjectId,
  toHaveMongoFields,
  toBeBuffer,
  toHaveCompressionRatio,
  toBeValidUser,
  toBeValidSong,
  toBeValidArrangement,
  toHaveValidPagination,
  toHaveErrorStructure,
  toHaveApiResponseStructure,
  toUseMemoryWithin
})

// ============================================================================
// TypeScript Declarations
// ============================================================================

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidObjectId(): T
    toHaveMongoFields(fields?: string[]): T
    toBeBuffer(): T
    toHaveCompressionRatio(min: number, max?: number): T
    toBeValidUser(): T
    toBeValidSong(): T
    toBeValidArrangement(): T
    toHaveValidPagination(): T
    toHaveErrorStructure(): T
    toHaveApiResponseStructure(expectData?: boolean): T
    toUseMemoryWithin(memoryLimit: number): T
  }
}