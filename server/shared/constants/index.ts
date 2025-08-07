/**
 * Application Constants
 * Centralized configuration values
 */

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
} as const

// Database
export const DATABASE = {
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 5,
  RETRY_DELAY: 5000, // 5 seconds
  POOL_SIZE: 10
} as const

// API Versioning
export const API = {
  VERSION: 'v1',
  BASE_PATH: '/api/v1'
} as const

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const

// Rate Limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  MESSAGE: 'Too many requests from this IP, please try again later'
} as const

// Compression
export const COMPRESSION = {
  LEVEL: 3, // ZSTD compression level (1-22, 3 is default)
  MIN_SIZE_BYTES: 100, // Don't compress if smaller than this
  LOG_METRICS: true
} as const

// Cache
export const CACHE = {
  TTL_SECONDS: 300, // 5 minutes
  MAX_ITEMS: 1000,
  CHECK_PERIOD: 600 // 10 minutes
} as const

// Validation
export const VALIDATION = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_TAGS: 10,
  MAX_TAG_LENGTH: 50,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  SLUG_PATTERN: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
} as const

// File Limits
export const FILE_LIMITS = {
  MAX_CHORD_PRO_SIZE: 1024 * 1024, // 1MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['text/plain', 'application/pdf']
} as const

// Time
export const TIME = {
  ONE_SECOND: 1000,
  ONE_MINUTE: 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000
} as const

// Environment
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  STAGING: 'staging'
} as const

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'An internal server error occurred',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  INVALID_CREDENTIALS: 'Invalid credentials provided',
  EXPIRED_TOKEN: 'Token has expired',
  DUPLICATE_ENTRY: 'A resource with this identifier already exists'
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  OPERATION_COMPLETED: 'Operation completed successfully'
} as const

// Default Values
export const DEFAULTS = {
  RATING: 0,
  VIEWS: 0,
  TEMPO: 120,
  TIME_SIGNATURE: '4/4',
  DIFFICULTY: 'intermediate' as const,
  KEY: 'C',
  IS_PUBLIC: false
} as const