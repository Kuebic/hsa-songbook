import { Types } from 'mongoose'

// Test document type for Mongoose documents
export type TestDocument<T = Record<string, unknown>> = T & {
  _id?: Types.ObjectId | string
  __v?: number
  save?: () => Promise<unknown>
  toObject?: () => unknown
  toJSON?: () => unknown
  populate?: (path: string) => Promise<unknown>
  [key: string]: unknown
}

// Test error type for error handling
export type TestError = Error & {
  code?: number | string
  statusCode?: number
  status?: number
  details?: unknown
  errors?: Record<string, unknown>
  keyPattern?: Record<string, number>
  keyValue?: Record<string, unknown>
  [key: string]: unknown
}

// Mock function types for vitest
export type MockFunction<T = unknown> = {
  (...args: unknown[]): T
  mockClear: () => void
  mockReset: () => void
  mockRestore: () => void
  mockReturnValue: (value: T) => void
  mockReturnValueOnce: (value: T) => void
  mockResolvedValue: (value: T) => void
  mockResolvedValueOnce: (value: T) => void
  mockRejectedValue: (value: unknown) => void
  mockRejectedValueOnce: (value: unknown) => void
  mockImplementation: (fn: (...args: unknown[]) => T) => void
  mockImplementationOnce: (fn: (...args: unknown[]) => T) => void
  mock: {
    calls: unknown[][]
    results: Array<{ type: string; value: T }>
  }
}

// Validation error type for Mongoose/Zod validation
export type ValidationError = {
  errors?: Record<string, {
    message?: string
    path?: string
    value?: unknown
    kind?: string
    properties?: Record<string, unknown>
  }>
  _message?: string
  message?: string
  name?: string
}

// Request body type for API testing
export type TestRequestBody = Record<string, unknown>

// Response body type for API testing  
export type TestResponseBody = Record<string, unknown> | unknown[]

// Database query type
export type TestQuery = Record<string, unknown>

// Partial document for updates
export type PartialDocument<T> = Partial<T>

// Factory function return type
export type FactoryResult<T> = T & TestDocument<T>

// Test user type
export type TestUser = {
  id: string
  email?: string
  username?: string
  firstName?: string
  lastName?: string
  role?: string
  createdAt?: Date
  updatedAt?: Date
}

// Test auth context
export type TestAuthContext = {
  userId: string
  sessionId?: string
  role?: string
  permissions?: string[]
}