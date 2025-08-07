import { vi } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { TestRequestBody, MockFunction } from './test-types'

// ============================================================================
// Type Definitions
// ============================================================================

interface MockClerkUser {
  id: string
  email_addresses: Array<{
    email_address: string
    verification: { status: string }
  }>
  username: string
  first_name: string
  last_name: string
  image_url: string
  created_at: number
  updated_at: number
}

interface MockClerkWebhook {
  type: 'user.created' | 'user.updated' | 'user.deleted'
  data: MockClerkUser
  object: string
  evt: {
    id: string
    type: string
  }
}

interface MockRequest extends Partial<Request> {
  body?: TestRequestBody
  params?: Record<string, string>
  query?: TestRequestBody
  headers?: Record<string, string | string[] | undefined>
  user?: unknown
}

interface MockResponse {
  status: ReturnType<typeof vi.fn>
  json: ReturnType<typeof vi.fn>
  send: ReturnType<typeof vi.fn>
  cookie: ReturnType<typeof vi.fn>
  clearCookie: ReturnType<typeof vi.fn>
  redirect: ReturnType<typeof vi.fn>
}

interface MockCompressionService {
  compressChordPro: ReturnType<typeof vi.fn>
  decompressChordPro: ReturnType<typeof vi.fn>
  calculateMetrics: ReturnType<typeof vi.fn>
  compressMultiple: ReturnType<typeof vi.fn>
}

interface MockLogger {
  debug: ReturnType<typeof vi.fn>
  info: ReturnType<typeof vi.fn>
  warn: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
}

interface DatabaseValidationError extends Error {
  name: 'ValidationError'
  errors: Record<string, { message: string; kind: string }>
}

interface DatabaseDuplicateError extends Error {
  code: number
}

interface JWTPayload {
  sub?: string
  iat?: number
  exp?: number
  [key: string]: unknown
}

// ============================================================================
// Clerk Service Mocks
// ============================================================================

/**
 * Mock Clerk webhook signature verification
 */
export const mockClerkWebhookVerification = (shouldPass: boolean = true) => {
  const mockVerify = vi.fn()
  
  if (shouldPass) {
    mockVerify.mockResolvedValue(true)
  } else {
    mockVerify.mockRejectedValue(new Error('Invalid webhook signature'))
  }
  
  return mockVerify
}

/**
 * Mock Clerk user data
 */
export const createMockClerkUser = (overrides: Partial<MockClerkUser> = {}): MockClerkUser => ({
  id: `clerk_${Date.now()}`,
  email_addresses: [{
    email_address: `test-${Date.now()}@example.com`,
    verification: { status: 'verified' }
  }],
  username: `testuser${Date.now()}`,
  first_name: 'Test',
  last_name: 'User',
  image_url: 'https://test.example.com/avatar.jpg',
  created_at: Date.now(),
  updated_at: Date.now(),
  ...overrides
})

/**
 * Mock Clerk webhook payload
 */
export const createMockClerkWebhook = (
  eventType: 'user.created' | 'user.updated' | 'user.deleted',
  userData: Partial<MockClerkUser> = {}
): MockClerkWebhook => ({
  type: eventType,
  data: createMockClerkUser(userData),
  object: 'event',
  evt: {
    id: `evt_${Date.now()}`,
    type: eventType
  }
})

// ============================================================================
// Compression Service Mocks
// ============================================================================

/**
 * Mock compression service for unit tests
 */
export const mockCompressionService = (): MockCompressionService => {
  const mockCompress = vi.fn()
  const mockDecompress = vi.fn()
  const mockCalculateMetrics = vi.fn()
  
  // Default implementations
  mockCompress.mockImplementation(async (text: string) => {
    // Simulate compression by creating a smaller buffer
    const compressed = Buffer.from(`compressed:${text.substring(0, text.length / 2)}`)
    return compressed
  })
  
  mockDecompress.mockImplementation(async (buffer: Buffer) => {
    // Simulate decompression
    const compressed = buffer.toString()
    return compressed.replace('compressed:', '').repeat(2)
  })
  
  mockCalculateMetrics.mockImplementation((original: string, compressed: Buffer) => ({
    originalSize: Buffer.byteLength(original, 'utf-8'),
    compressedSize: compressed.length,
    ratio: 50, // 50% compression
    savings: Buffer.byteLength(original, 'utf-8') - compressed.length
  }))
  
  return {
    compressChordPro: mockCompress,
    decompressChordPro: mockDecompress,
    calculateMetrics: mockCalculateMetrics,
    compressMultiple: vi.fn()
  }
}

// ============================================================================
// Database Mocks
// ============================================================================

/**
 * Mock MongoDB connection errors
 */
export const mockDatabaseError = (errorType: 'connection' | 'timeout' | 'validation' | 'duplicate') => {
  switch (errorType) {
    case 'connection':
      return new Error('MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017')
    case 'timeout':
      return new Error('MongooseTimeoutError: Operation `users.findOne()` buffering timed out after 10000ms')
    case 'validation': {
      const validationError = new Error('Validation failed') as DatabaseValidationError
      validationError.name = 'ValidationError'
      validationError.errors = {
        email: { message: 'Email is required', kind: 'required' },
        username: { message: 'Username must be unique', kind: 'unique' }
      }
      return validationError
    }
    case 'duplicate': {
      const duplicateError = new Error('E11000 duplicate key error') as DatabaseDuplicateError
      duplicateError.code = 11000
      return duplicateError
    }
    default:
      return new Error('Database error')
  }
}

// ============================================================================
// Logger Mocks
// ============================================================================

/**
 * Mock logger for testing
 */
export const mockLogger = (): MockLogger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
})

// ============================================================================
// Express Mocks
// ============================================================================

/**
 * Mock Express request object
 */
export const createMockRequest = (overrides: Partial<MockRequest> = {}): MockRequest => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides
})

/**
 * Mock Express response object
 */
export const createMockResponse = (): MockResponse => {
  const res = {} as MockResponse
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.send = vi.fn().mockReturnValue(res)
  res.cookie = vi.fn().mockReturnValue(res)
  res.clearCookie = vi.fn().mockReturnValue(res)
  res.redirect = vi.fn().mockReturnValue(res)
  return res
}

/**
 * Mock Express next function
 */
export const createMockNext = () => vi.fn()

// ============================================================================
// Authentication Mocks
// ============================================================================

/**
 * Mock JWT token generation
 */
export const createMockJWT = (payload: Partial<JWTPayload> = {}) => {
  const defaultPayload = {
    sub: `clerk_${Date.now()}`,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...payload
  }
  
  // Simple base64 encoding for testing
  return `mock.${Buffer.from(JSON.stringify(defaultPayload)).toString('base64')}.signature`
}

/**
 * Mock authentication middleware
 */
export const mockAuthMiddleware = (user: Record<string, unknown> | null = null) => {
  return (req: Request & { user?: Record<string, unknown> }, _res: Response, next: NextFunction) => {
    if (user) {
      req.user = user
    }
    next()
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Reset all mocks
 */
export const resetAllMocks = () => {
  vi.clearAllMocks()
}

/**
 * Mock implementation helper
 */
export const mockImplementation = <T extends (...args: unknown[]) => unknown>(
  fn: MockFunction,
  implementation: T
) => {
  return fn.mockImplementation(implementation)
}