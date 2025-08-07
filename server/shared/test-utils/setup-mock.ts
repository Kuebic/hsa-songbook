import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { createLogger } from '../services/logger'
import { TEST_TIMEOUTS } from './timeout-config'
import './custom-matchers' // Import custom matchers

const logger = createLogger('MockTestSetup')

// Mock MongoDB/Mongoose for environments where MongoDB Memory Server can't run
beforeAll(async () => {
  logger.info('Setting up mock test environment...')
  
  // Mock mongoose connection
  vi.mock('mongoose', () => {
    const mockConnection = {
      readyState: 1,
      collections: {},
      dropDatabase: vi.fn().mockResolvedValue(true),
      close: vi.fn().mockResolvedValue(true)
    }
    
    const mockTypes = {
      ObjectId: class MockObjectId {
        constructor(id?: string) {
          this.toString = () => id || '507f1f77bcf86cd799439011'
        }
        static isValid = vi.fn().mockReturnValue(true)
        static generate = () => '507f1f77bcf86cd799439012'
      }
    }
    
    return {
      default: {
        connect: vi.fn().mockResolvedValue(true),
        disconnect: vi.fn().mockResolvedValue(true),
        connection: mockConnection,
        Types: mockTypes
      },
      connect: vi.fn().mockResolvedValue(true),
      disconnect: vi.fn().mockResolvedValue(true),
      connection: mockConnection,
      Types: mockTypes,
      Schema: vi.fn().mockImplementation(() => ({
        index: vi.fn(),
        methods: {},
        statics: {},
        pre: vi.fn(),
        post: vi.fn()
      })),
      model: vi.fn().mockImplementation(() => ({
        create: vi.fn().mockResolvedValue({}),
        find: vi.fn().mockReturnThis(),
        findOne: vi.fn().mockReturnThis(),
        findById: vi.fn().mockReturnThis(),
        findByIdAndUpdate: vi.fn().mockReturnThis(),
        findOneAndUpdate: vi.fn().mockReturnThis(),
        deleteMany: vi.fn().mockResolvedValue({}),
        lean: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({}),
        collection: {
          getIndexes: vi.fn().mockResolvedValue({}),
          createIndex: vi.fn().mockResolvedValue({}),
          deleteMany: vi.fn().mockResolvedValue({})
        }
      }))
    }
  })
  
  logger.info('Mock test environment setup complete')
}, TEST_TIMEOUTS.UNIT.beforeAll) // Optimized timeout for mock setup

// Clean between each test
beforeEach(async () => {
  // Clear all mocks
  vi.clearAllMocks()
}, TEST_TIMEOUTS.UNIT.beforeEach) // Optimized timeout for mock cleanup

// Global cleanup after all tests
afterAll(async () => {
  logger.info('Cleaning up mock test environment...')
  
  // Restore all mocks
  vi.restoreAllMocks()
  
  logger.info('Mock test environment cleanup complete')
}, TEST_TIMEOUTS.UNIT.afterAll) // Optimized timeout for mock teardown

// Optional: Clean up any remaining resources after each test
afterEach(async () => {
  // Additional cleanup if needed
  
  // Force garbage collection in test environment
  if (global.gc) {
    global.gc()
  }
}, TEST_TIMEOUTS.UNIT.afterEach) // Optimized timeout for afterEach cleanup

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise)
  logger.error('Reason:', reason)
})

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
})